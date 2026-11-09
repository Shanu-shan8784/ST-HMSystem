import express from 'express';
import {
  getAllRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  assignStudentStop,
  getLiveLocations,
  getVehicles,
  sendAlert,
  recordTransportAttendance,
} from '../controllers/transport.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = express.Router();

router.get('/routes', protect, getAllRoutes);
router.post('/routes', protect, authorizeRoles('admin', 'driver'), createRoute);
router.put('/routes/:id', protect, authorizeRoles('admin', 'driver'), updateRoute);
router.delete('/routes/:id', protect, authorizeRoles('admin'), deleteRoute);

router.post('/assign-stop', protect, authorizeRoles('admin', 'driver', 'warden'), assignStudentStop);
router.get('/live-locations', protect, getLiveLocations);
router.get('/vehicles', protect, getVehicles);
router.post('/alerts', protect, authorizeRoles('admin', 'driver'), sendAlert);

// Boarding Attendance
router.post('/attendance', protect, authorizeRoles('admin', 'driver'), recordTransportAttendance);

export default router;
