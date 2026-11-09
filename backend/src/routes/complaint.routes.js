import express from 'express';
import { getAllComplaints, createComplaint, updateComplaintStatus } from '../controllers/complaint.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = express.Router();

router.get('/', protect, getAllComplaints);
router.post('/', protect, createComplaint);
router.patch('/:id/status', protect, authorizeRoles('admin', 'warden'), updateComplaintStatus);

export default router;

