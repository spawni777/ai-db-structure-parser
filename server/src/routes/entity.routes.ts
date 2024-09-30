import { Router } from 'express';
import { getEntities, saveEntities } from '@/controllers/entity.controller';

const router = Router();

router.get('/', getEntities);
router.post('/save', saveEntities);

export default router;
