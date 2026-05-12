import express from 'express';
import { 
    getUsers, 
    getReferrals,
    editUser, 
    scheduleCombo,
    getUserCombos,
    refreshUserOrders, 
    approveTransaction, 
    getAllTransactions,
    getStats,
    getTaskSettings,
    updateTaskSettings,
    getProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    getThreads,
    getThreadMessages,
    sendAdminMessage,
    resolveThread,
    getLevelRequests,
    approveLevelUnlock,
    changeAdminPassword
} from '../controllers/adminController';
import { 
    createVA, 
    getVAs, 
    updateVAPermissions, 
    approveVA, 
    revokeVAAccess, 
    getVAActivity 
} from '../controllers/vaController';
import { protect, admin } from '../middleware/auth';
import { adminOrVA } from '../middleware/vaMiddleware';

const router = express.Router();

// --- ADMIN SELF MANAGEMENT ---
router.post('/change-password', protect, admin, changeAdminPassword);

// --- VA MANAGEMENT (Admin Only) ---
router.post('/va', protect, admin, createVA);
router.get('/va', protect, admin, getVAs);
router.put('/va/:vaId/permissions', protect, admin, updateVAPermissions);
router.put('/va/:vaId/status', protect, admin, approveVA);
router.put('/va/:vaId/revoke', protect, admin, revokeVAAccess);
router.delete('/va/:vaId', protect, admin, revokeVAAccess); // Use same logic or create separate one
router.get('/va/:vaId/activity', protect, admin, getVAActivity);


// --- CORE ADMIN ACTIONS (Admin or VA with permissions) ---

router.get('/users', protect, adminOrVA(), getUsers);
router.get('/referrals', protect, adminOrVA(), getReferrals);
router.put('/users/:userId', protect, adminOrVA('can_edit'), editUser);
router.post('/users/:userId/combo', protect, adminOrVA('can_edit'), scheduleCombo);
router.get('/users/:userId/combos', protect, adminOrVA(), getUserCombos);
router.post('/users/:userId/refresh', protect, adminOrVA('can_reset_tasks'), refreshUserOrders);

router.get('/transactions', protect, adminOrVA(), getAllTransactions);
router.put('/transactions/:txId', protect, adminOrVA('can_approve_finance'), approveTransaction);

router.get('/stats', protect, adminOrVA(), getStats);

// Level Approvals
router.get('/level-requests', protect, adminOrVA(), getLevelRequests);
router.put('/level-requests/:userId', protect, adminOrVA('can_approve_requests'), approveLevelUnlock);

// Task Settings
router.get('/task-settings', protect, adminOrVA('can_edit'), getTaskSettings);
router.put('/task-settings/:id', protect, adminOrVA('can_edit'), updateTaskSettings);

// Product Library
router.get('/products', protect, adminOrVA(), getProducts);
router.post('/products', protect, adminOrVA('can_edit'), addProduct);
router.put('/products/:id', protect, adminOrVA('can_edit'), updateProduct);
router.delete('/products/:id', protect, adminOrVA('can_edit'), deleteProduct);

// Support Chat
router.get('/chats', protect, adminOrVA(), getThreads);
// Note: Support chat usually needs a dedicated permission, let's use can_edit for simplicity or add one later
router.get('/chats/:threadId/messages', protect, adminOrVA(), getThreadMessages);
router.post('/chats/:threadId/message', protect, adminOrVA(), sendAdminMessage);
router.put('/chats/:threadId/resolve', protect, adminOrVA(), resolveThread);

export default router;
