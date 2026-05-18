import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../index.js";
import { createError } from "../utils/errors.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

function validateEmail(email) {
  if (!EMAIL_REGEX.test(email)) {
    throw createError("Neveljaven format e-pošte.", 400);
  }
}

function validatePasswordLength(password) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw createError("Geslo mora imeti vsaj 8 znakov.", 400);
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

function formatUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export async function findAll() {
  return prisma.user.findMany();
}

export async function findById(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw createError("Uporabnik ne obstaja.", 404);
  return formatUser(user);
}

export async function createUser(name, email, password) {
  if (!name || !email || !password) {
    throw createError("Ime, email in geslo so obvezni.", 400);
  }

  validateEmail(email);
  validatePasswordLength(password);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw createError("Uporabnik s tem emailom že obstaja.", 409);
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });
  return formatUser(user);
}

export async function authenticate(email, password) {
  if (!email || !password) {
    throw createError("Email in geslo sta obvezna.", 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw createError("Napačen email ali geslo.", 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw createError("Napačen email ali geslo.", 401);

  const tokens = signTokens(user);
  return { ...tokens, user: formatUser(user) };
}

export async function rotateTokens(refreshToken) {
  if (!refreshToken) {
    throw createError("Refresh token je obvezen.", 400);
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw createError("Neveljaven ali potekel refresh token.", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw createError("Uporabnik ne obstaja.", 401);

  return signTokens(user);
}

export async function updateProfile(id, { name, email }) {
  if (!name && !email) {
    throw createError("Vsaj eno polje je obvezno.", 400);
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw createError("Uporabnik ne obstaja.", 404);

  const data = {};
  if (name) data.name = name;
  if (email) {
    validateEmail(email);
    data.email = email;
  }

  const user = await prisma.user.update({ where: { id }, data });
  return formatUser(user);
}

export async function changePassword(id, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) {
    throw createError("Trenutno in novo geslo sta obvezna.", 400);
  }

  validatePasswordLength(newPassword);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw createError("Uporabnik ne obstaja.", 404);

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw createError("Trenutno geslo je napačno.", 401);

  const hashed = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  await prisma.user.update({ where: { id }, data: { password: hashed } });
}

export async function updateById(id, { name, email, password }) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw createError("Uporabnik ne obstaja.", 404);

  const data = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (password) {
    validatePasswordLength(password);
    data.password = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  const user = await prisma.user.update({ where: { id }, data });
  return formatUser(user);
}

export async function deleteById(id) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw createError("Uporabnik ne obstaja.", 404);
  await prisma.user.delete({ where: { id } });
}
