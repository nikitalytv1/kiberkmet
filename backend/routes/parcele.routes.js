import { Router } from 'express';

import {
  getParcele,
  getParcelaById,
  createParcela,
  updateParcela,
  analyzeParcela,
  deleteParcela,
  getTypes,
  getCropPlans,
  createCropPlan,
  updateCropPlan,
  deleteCropPlan,
} from '../controllers/parcele.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/types', getTypes);
router.get('/', requireAuth, getParcele);
router.get('/:id', requireAuth, getParcelaById);
router.post('/', requireAuth, createParcela);
router.put('/:id', requireAuth, updateParcela);
router.post('/:id/analyze', requireAuth, analyzeParcela);
router.get('/:id/crop-plans', requireAuth, getCropPlans);
router.post('/:id/crop-plans', requireAuth, createCropPlan);
router.put('/:id/crop-plans/:planId', requireAuth, updateCropPlan);
router.delete('/:id/crop-plans/:planId', requireAuth, deleteCropPlan);
router.delete('/:id', requireAuth, deleteParcela);

export default router;
