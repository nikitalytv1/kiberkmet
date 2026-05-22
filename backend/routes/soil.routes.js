import { Router } from 'express';
import { getSoil } from '../controllers/soil.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, getSoil);

export default router;
