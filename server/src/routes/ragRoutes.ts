import { Router } from 'express';

import {
  askMedicalQuestion,
} from '../controllers/ragController.js';

const router = Router();

router.post('/ask', askMedicalQuestion);

export default router;