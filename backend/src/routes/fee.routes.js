import express from 'express';
import { getAllFees, getStudentFees, createFee, payFee } from '../controllers/fee.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = express.Router();

router.get('/', protect, getAllFees);
router.get('/my-fees', protect, getStudentFees);
router.post('/', protect, authorizeRoles('admin', 'warden'), createFee);
router.patch('/:id/pay', protect, payFee);

export default router;

