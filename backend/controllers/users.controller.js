import { prisma } from "../index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// GET ALL
export async function getUsers(req, res) {
  try {
    const users = await prisma.user.findMany();
    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Interna napaka strežnika." });
  }
}

// REGISTER
export async function registerUser(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Ime, email in geslo so obvezni." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Neveljaven format e-pošte." });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Geslo mora imeti vsaj 8 znakov." });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res
        .status(409)
        .json({ error: "Uporabnik s tem emailom že obstaja." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Interna napaka strežnika." });
  }
}

function signTokens(user) {
  const payload = { userId: user.id, email: user.email };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });

  return { accessToken, refreshToken };
}

// LOGIN
export async function loginUser(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email in geslo sta obvezna." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Napačen email ali geslo." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Napačen email ali geslo." });
    }

    const { accessToken, refreshToken } = signTokens(user);

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Interna napaka strežnika." });
  }
}

// REFRESH TOKEN
export async function refreshToken(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token je obvezen." });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return res.status(401).json({ error: "Uporabnik ne obstaja." });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = signTokens(user);

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch {
    return res.status(401).json({ error: "Neveljaven ali potekel refresh token." });
  }
}

// UPDATE
export async function updateUser(req, res) {
  const { id } = req.params;
  const { name, email, password } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Uporabnik ne obstaja." });
    }

    const data = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (password) {
      if (password.length < 8) {
        return res
          .status(400)
          .json({ error: "Geslo mora imeti vsaj 8 znakov." });
      }
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({ where: { id }, data });
    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Interna napaka strežnika." });
  }
}

// DELETE
export async function deleteUser(req, res) {
  const { id } = req.params;

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Uporabnik ne obstaja." });
    }

    await prisma.user.delete({ where: { id } });
    return res.json({ message: "Uporabnik izbrisan." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Interna napaka strežnika." });
  }
}

// LOGOUT
export async function logoutUser(req, res) {
  return res.json({ message: "Odjava uspešna." });
}

// GET ME
export async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      return res.status(404).json({ error: "Uporabnik ne obstaja." });
    }
    return res.json({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Interna napaka strežnika." });
  }
}
