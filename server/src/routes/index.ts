import { Router } from 'express';
import gptRoutes from './gpt.routes';
import entityRoutes from './entity.routes';

const router = Router();

router.use('/gpt', gptRoutes);
router.use('/entities', entityRoutes);

export default router;
