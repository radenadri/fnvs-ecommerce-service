import { Router } from 'express';
import { HealthController } from '@/controllers/health.controller';

const router = Router();
const healthController = new HealthController();

// Health check route
router.get('/', healthController.health.bind(healthController));

export default router;
