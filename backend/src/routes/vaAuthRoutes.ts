import express from 'express';
import { vaLogin } from '../controllers/vaController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/login', vaLogin);
router.get('/me', protect, (req: any, res) => {
  res.json({ 
    success: true, 
    data: { 
      _id: req.va?.id || req.user?.id, 
      username: req.va?.username || req.user?.username,
      role: req.va ? 'va' : 'admin',
      permissions: req.va?.permissions || {}
    } 
  });
});

export default router;
