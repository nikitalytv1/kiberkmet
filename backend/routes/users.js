import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../index.js";

const router = Router();

router.get("/", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

router.post("/", async (req, res) => {
  const { name, email } = req.body;
  const user = await prisma.user.create({ data: { name, email } });
  res.status(201).json(user);
});

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Ime, email in geslo so obvezni." });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Uporabnik s tem emailom že obstaja." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  res.status(201).json({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt });
})

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email in geslo sta obvezna." });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Napačen email ali geslo." });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Napačen email ali geslo." });
  }

  res.json({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt });
})

router.post("/logout", (req, res) => {
  res.json({ message: "Odjava uspešna." });
})

export default router;