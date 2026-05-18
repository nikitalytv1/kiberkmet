import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getTopCrops, getTopCropsByParcela } from '../controllers/statistics.controller.js';

const router = Router();

router.get('/top-crops', getTopCrops);
router.get('/top-crops/parcela/:id', requireAuth, getTopCropsByParcela);

export default router;
