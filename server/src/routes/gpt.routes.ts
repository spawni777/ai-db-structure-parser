import { Router } from 'express';
import { parseEntity } from '@/controllers/gpt.controller';

const router = Router();

router.post('/parse-entity', parseEntity);

export default router;
