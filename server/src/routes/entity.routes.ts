import { Router } from 'express';
import { deleteEntity, getEntities, saveEntities } from '@/controllers/entity.controller';

const router = Router();

router.get('/', getEntities);
router.post('/', saveEntities);
router.delete('/:name', deleteEntity);

export default router;
