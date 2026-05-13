import express from 'express';
import { getProfile, generateTask, completeTask, submitDeposit, getTransactions, submitWithdrawal, updateAvatar, updateWithdrawalAddress, getTaskSettings, getTasks, selectRoom, requestLevelUnlock } from '../controllers/userController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.get('/transactions', getTransactions);
router.get('/task-settings', getTaskSettings);
router.get('/tiers', getTaskSettings);
router.post('/room/select', selectRoom);
router.post('/task/generate', generateTask);
router.post('/task/complete', completeTask);
router.post('/deposit', submitDeposit);
router.post('/withdraw', submitWithdrawal);
router.post('/request-level-unlock', requestLevelUnlock);
router.get('/tasks', getTasks);
router.put('/avatar', updateAvatar);
router.put('/withdrawal-address', updateWithdrawalAddress);

export default router;
