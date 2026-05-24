import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getTopCrops, getTopCropsByParcela, getYieldStatsByParcela } from '../controllers/statistics.controller.js';

const router = Router();

router.get('/top-crops', getTopCrops);
router.get('/top-crops/parcela/:id', requireAuth, getTopCropsByParcela);
router.get('/yields/parcela/:id', requireAuth, getYieldStatsByParcela);

export default router;
