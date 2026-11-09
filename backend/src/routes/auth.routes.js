import express from 'express';
import {
  login,
  register,
  refreshSession,
  logout,
  getProfile,
  getAllUsers,
  deleteUser,
  createUser,
  getPendingStudents,
  reviewStudentApproval,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = express.Router();

// Public authentication routes (Registration strictly for Students only)
router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refreshSession);
router.post('/logout', logout);

// Protected authenticated user endpoints
router.get('/profile', protect, getProfile);
router.get('/me', protect, getProfile);

// User authority routes (Admin can manage all users; Warden can view directory and enroll students)
router.get('/users', protect, authorizeRoles('admin', 'warden'), getAllUsers);
router.post('/create-user', protect, authorizeRoles('admin', 'warden'), createUser);
router.delete('/users/:id', protect, authorizeRoles('admin'), deleteUser);

// Student registration approval queue (Admin only)
router.get('/pending-students', protect, authorizeRoles('admin'), getPendingStudents);
router.patch('/approve-student/:id', protect, authorizeRoles('admin'), reviewStudentApproval);

export default router;
