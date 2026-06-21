import { Router } from "express";

import {
  getUsers,
  getMe,
  registerUser,
  loginUser,
  refreshToken,
  updateUser,
  updateMe,
  changePassword,
  logoutUser,
} from "../controllers/users.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Javni routi
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshToken);

// Zaščiteni routi
router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);
router.put("/me/password", requireAuth, changePassword);
router.get("/", requireAuth, getUsers);
router.put("/:id", requireAuth, updateUser);
router.post("/logout", requireAuth, logoutUser);

export default router;
