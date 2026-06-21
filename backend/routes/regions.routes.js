import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getRegions, getParceleByRegion } from '../controllers/regions.controller.js';

const router = Router();

router.get('/', requireAuth, getRegions);
router.get('/:regionCode/parcele', requireAuth, getParceleByRegion);

export default router;
