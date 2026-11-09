import express from 'express';
import {
  getAllRooms,
  allocateRoom,
  swapStudents,
  updateRoomStatus,
  getMessMenu,
  getLeaveRequests,
  applyOutpass,
  updateOutpassStatus,
  recordHostelAttendance,
} from '../controllers/hostel.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = express.Router();

// Rooms Matrix
router.get('/rooms', protect, getAllRooms);
router.post('/rooms/allocate', protect, authorizeRoles('admin', 'warden'), allocateRoom);
router.post('/rooms/swap', protect, authorizeRoles('admin', 'warden'), swapStudents);
router.patch('/rooms/:id/status', protect, authorizeRoles('admin', 'warden'), updateRoomStatus);

// Mess Menu
router.get('/mess-menu', protect, getMessMenu);

// Outpasses / Leaves
router.get('/leave-requests', protect, getLeaveRequests);
router.post('/outpass', protect, applyOutpass);
router.patch('/outpass/:id/status', protect, authorizeRoles('admin', 'warden'), updateOutpassStatus);

// Attendance
router.post('/attendance', protect, authorizeRoles('admin', 'warden'), recordHostelAttendance);

export default router;
