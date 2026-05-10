import express from 'express';
import { getThread, sendMessage } from '../controllers/chatController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/thread', protect, getThread);
router.post('/message', protect, sendMessage);

export default router;
