import Route from '../models/Route.model.js';
import Vehicle from '../models/Vehicle.model.js';
import User from '../models/User.model.js';
import Attendance from '../models/Attendance.model.js';
import { recordAuditLog } from '../services/audit.service.js';

// Predefined Skardu City (Northern Areas, Pakistan) Transit Stops
const SKARDU_ROUTES_WAYPOINTS = {
  'R-101': [
    { stopName: 'Skardu Airport Terminal', morningTime: '07:15 AM', eveningTime: '05:30 PM', lat: 35.3355, lng: 75.5361 },
    { stopName: 'Kachura Junction', morningTime: '07:35 AM', eveningTime: '05:50 PM', lat: 35.3141, lng: 75.6072 },
    { stopName: 'Skardu Main Bazaar', morningTime: '07:55 AM', eveningTime: '06:10 PM', lat: 35.2969, lng: 75.6341 },
    { stopName: 'Baltistan University Campus', morningTime: '08:20 AM', eveningTime: '06:35 PM', lat: 35.2831, lng: 75.6541 },
  ],
  'R-102': [
    { stopName: 'Sadpara Lake Road', morningTime: '07:10 AM', eveningTime: '05:25 PM', lat: 35.2201, lng: 75.6482 },
    { stopName: 'Hargisa Waterfall Point', morningTime: '07:30 AM', eveningTime: '05:45 PM', lat: 35.2655, lng: 75.6300 },
    { stopName: 'Kharpocho Fort Base', morningTime: '07:50 AM', eveningTime: '06:05 PM', lat: 35.3041, lng: 75.6161 },
    { stopName: 'Campus South Terminal', morningTime: '08:15 AM', eveningTime: '06:30 PM', lat: 35.2810, lng: 75.6590 },
  ],
  'R-103': [
    { stopName: 'Indus River Bridge', morningTime: '07:20 AM', eveningTime: '05:35 PM', lat: 35.2771, lng: 75.6241 },
    { stopName: 'Shigar Valley Turnoff', morningTime: '07:45 AM', eveningTime: '06:00 PM', lat: 35.3371, lng: 75.6621 },
    { stopName: 'Baltistan University Main Gate', morningTime: '08:15 AM', eveningTime: '06:30 PM', lat: 35.2831, lng: 75.6541 },
  ],
};

const ensureSkarduCoordinates = async (routes) => {
  for (const r of routes) {
    const hasOldCoords = !r.stops || r.stops.length === 0 || (r.stops[0]?.lat && r.stops[0].lat < 32);
    if (hasOldCoords) {
      const skarduStops = SKARDU_ROUTES_WAYPOINTS[r.routeCode] || [
        { stopName: 'Skardu Main Bazaar', morningTime: '07:30 AM', eveningTime: '05:30 PM', lat: 35.2971, lng: 75.6341 },
        { stopName: 'Baltistan University Gate', morningTime: '08:15 AM', eveningTime: '06:15 PM', lat: 35.2831, lng: 75.6541 },
      ];
      r.stops = skarduStops;
      r.currentCoordinates = { lat: skarduStops[0].lat, lng: skarduStops[0].lng };
      try {
        await Route.findByIdAndUpdate(r._id, {
          stops: skarduStops,
          currentCoordinates: { lat: skarduStops[0].lat, lng: skarduStops[0].lng },
        });
      } catch (e) {
        // Continue
      }
    }
  }
};

export const getAllRoutes = async (req, res) => {
  try {
    const filter = {};
    const routes = await Route.find(filter).sort({ routeCode: 1 });
    await ensureSkarduCoordinates(routes);
    return res.json({ success: true, routes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createRoute = async (req, res) => {
  try {
    const { routeName, routeCode, driverName, driverPhone, vehicleNumber, stops } = req.body;
    if (!routeName || !routeCode) {
      return res.status(400).json({ success: false, message: 'Route Name and Route Code are required' });
    }

    const defaultStops = stops && stops.length > 0 ? stops : [
      { stopName: 'Skardu Main Bazaar', morningTime: '07:30 AM', eveningTime: '05:30 PM', lat: 35.2971, lng: 75.6341 },
      { stopName: 'Baltistan University Gate', morningTime: '08:15 AM', eveningTime: '06:15 PM', lat: 35.2831, lng: 75.6541 },
    ];

    const newRoute = await Route.create({
      routeName,
      routeCode: routeCode.trim(),
      driverName: driverName || 'Assigned Driver',
      driverPhone: driverPhone || '',
      vehicleNumber: vehicleNumber || 'BUS-NEW',
      stops: defaultStops,
      activeStudentsCount: 0,
      status: 'On Schedule',
      currentCoordinates: defaultStops[0] ? { lat: defaultStops[0].lat, lng: defaultStops[0].lng } : { lat: 35.2971, lng: 75.6341 },
      alerts: [],
    });

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'ROUTE_CREATED',
      targetResource: 'routes',
      targetId: newRoute._id.toString(),
      details: { routeCode: newRoute.routeCode, routeName: newRoute.routeName },
      req,
    });

    return res.status(201).json({ success: true, route: newRoute });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;

    // Driver boundary: If driver, verify they are assigned to this route
    if (req.user?.role === 'driver') {
      const existingRoute = await Route.findById(id);
      if (!existingRoute || (existingRoute.driverName !== req.user.name && String(existingRoute.assignedDriverId) !== String(req.user._id))) {
        return res.status(403).json({ success: false, message: 'Access Denied: You can only update your assigned route' });
      }
    }

    const route = await Route.findByIdAndUpdate(id, req.body, { new: true });
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'ROUTE_UPDATED',
      targetResource: 'routes',
      targetId: id,
      details: { routeCode: route.routeCode },
      req,
    });

    return res.json({ success: true, route });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;
    await Route.findByIdAndDelete(id);

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'ROUTE_DELETED',
      targetResource: 'routes',
      targetId: id,
      req,
    });

    return res.json({ success: true, message: 'Route deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignStudentStop = async (req, res) => {
  try {
    const { studentId, routeId, stopName } = req.body;
    if (!studentId || !routeId || !stopName) {
      return res.status(400).json({ success: false, message: 'studentId, routeId, and stopName are required' });
    }

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Transit route not found' });
    }

    const student = await User.findByIdAndUpdate(
      studentId,
      {
        busRouteId: route.routeCode,
        busRouteObjectId: route._id,
        busStop: stopName,
      },
      { new: true }
    );

    await Route.findByIdAndUpdate(routeId, { $inc: { activeStudentsCount: 1 } });

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'STUDENT_ROUTE_ASSIGNED',
      targetResource: 'routes',
      targetId: routeId,
      details: { studentName: student?.name, stopName },
      req,
    });

    return res.json({ success: true, message: 'Student successfully assigned to route stop', student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLiveLocations = async (req, res) => {
  try {
    const routes = await Route.find();
    await ensureSkarduCoordinates(routes);
    const timeSeconds = Math.floor(Date.now() / 3000);

    const routesWithDynamicLoc = routes.map((route, i) => {
      const stops = route.stops || [];
      if (stops.length < 2) return route.toObject();

      const step = (timeSeconds + i * 2) % stops.length;
      const nextStep = (step + 1) % stops.length;
      const progress = (Date.now() % 3000) / 3000;

      const lat = stops[step].lat + (stops[nextStep].lat - stops[step].lat) * progress;
      const lng = stops[step].lng + (stops[nextStep].lng - stops[step].lng) * progress;

      return {
        ...route.toObject(),
        currentCoordinates: { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) },
        nextStop: stops[nextStep].stopName,
        speedKmh: Math.floor(35 + Math.sin(timeSeconds + i) * 12),
      };
    });

    return res.json({ success: true, liveBuses: routesWithDynamicLoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    return res.json({ success: true, vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendAlert = async (req, res) => {
  try {
    const { routeId, message, severity = 'info' } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    const alertItem = {
      message,
      severity,
      time: new Date(),
    };

    if (routeId) {
      await Route.findByIdAndUpdate(routeId, { $push: { alerts: alertItem } });
    } else {
      await Route.updateMany({}, { $push: { alerts: alertItem } });
    }

    return res.json({ success: true, message: 'Alert notification broadcasted to parents', alert: alertItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Record Bus Boarding Attendance (Driver / Admin)
 */
export const recordTransportAttendance = async (req, res) => {
  try {
    const { studentId, studentName, rollNumber, status, date, routeCode, remarks } = req.body;
    if (!studentId || !studentName) {
      return res.status(400).json({ success: false, message: 'Student ID and name are required' });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const record = await Attendance.findOneAndUpdate(
      { studentId, type: 'transport', date: attendanceDate },
      {
        studentName,
        rollNumber: rollNumber || '',
        status: status || 'present',
        markedBy: req.user._id,
        locationOrRoute: routeCode || req.user?.assignedRoute || 'Bus Boarding',
        remarks: remarks || '',
      },
      { upsert: true, new: true }
    );

    return res.json({ success: true, message: 'Transit boarding attendance recorded', record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
