import { Router } from 'express';
import { getSoil } from '../controllers/soil.controller.js';

const router = Router();

router.get('/', getSoil);

export default router;
