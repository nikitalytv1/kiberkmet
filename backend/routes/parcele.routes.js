import { Router } from 'express';

import {
  getParcele,
  getParcelaById,
  createParcela,
  updateParcela,
  deleteParcela
} from '../controllers/parcele.controller.js';

const router = Router();

router.get('/', getParcele);

router.get('/:id', getParcelaById);

router.post('/', createParcela);

router.put('/:id', updateParcela);

router.delete('/:id', deleteParcela);

export default router;