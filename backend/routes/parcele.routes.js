import { Router } from 'express';

import {
  getParcele,
  getParcelaById,
  createParcela,
  updateParcela,
  analyzeParcela,
  deleteParcela,
  getTypes,
} from '../controllers/parcele.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/types', getTypes);
router.get('/', requireAuth, getParcele);
router.get('/:id', requireAuth, getParcelaById);
router.post('/', requireAuth, createParcela);
router.put('/:id', requireAuth, updateParcela);
router.post('/:id/analyze', requireAuth, analyzeParcela);
router.delete('/:id', requireAuth, deleteParcela);

export default router;
