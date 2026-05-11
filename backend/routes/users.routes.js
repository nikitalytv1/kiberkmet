import { Router } from 'express';

import {
  getUsers,
  registerUser,
  loginUser,
  refreshToken,
  updateUser,
  deleteUser,
  logoutUser,
} from '../controllers/users.controller.js';

const router = Router();

router.get('/', getUsers);

router.post('/register', registerUser);

router.post('/login', loginUser);

router.post('/refresh', refreshToken);

router.post('/logout', logoutUser);

router.put('/:id', updateUser);

router.delete('/:id', deleteUser);

export default router;
