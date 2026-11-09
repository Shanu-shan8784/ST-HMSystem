import Room from '../models/Room.model.js';
import Outpass from '../models/Outpass.model.js';
import Student from '../models/Student.model.js';
import User from '../models/User.model.js';
import Attendance from '../models/Attendance.model.js';
import { weeklyMessMenu } from '../utils/initialData.js';
import { recordAuditLog } from '../services/audit.service.js';

/**
 * Get all rooms (Wardens see only their assigned blocks unless Admin)
 */
export const getAllRooms = async (req, res) => {
  try {
    const filter = {};

    // Warden boundary enforcement: filter by assigned blocks
    if (req.user?.role === 'warden' && req.user.assignedBlocks?.length > 0) {
      filter.block = { $in: req.user.assignedBlocks };
    }

    const rooms = await Room.find(filter).sort({ block: 1, roomNumber: 1 });
    return res.json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Allocate a student to a room bed
 * Enforces:
 * 1. Capacity boundary (overbooking prevention)
 * 2. Duplicate allocation prevention (student cannot have two rooms)
 * 3. Warden block boundary
 * 4. Dual-sync with Student document
 */
export const allocateRoom = async (req, res) => {
  try {
    const { roomId, studentId, studentName, rollNumber, bedNumber } = req.body;
    if (!roomId || (!studentName && !studentId)) {
      return res.status(400).json({ success: false, message: 'Room ID and Student identifier are required' });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found in database' });

    // Warden block restriction check
    if (req.user?.role === 'warden') {
      const allowedBlocks = req.user.assignedBlocks || [req.user.hostelBlock];
      if (!allowedBlocks.some((b) => b && b.toLowerCase().includes(room.block.toLowerCase()))) {
        return res.status(403).json({
          success: false,
          message: `Access Denied: You are not authorized to allocate rooms in ${room.block}.`,
        });
      }
    }

    // Capacity constraint
    if (room.occupiedBeds >= room.capacity) {
      return res.status(400).json({ success: false, message: `Room ${room.roomNumber} is already at full capacity (${room.capacity} beds).` });
    }

    // Resolve student record in database
    let student = null;
    if (studentId) {
      student = await Student.findById(studentId);
    }
    if (!student && rollNumber) {
      student = await Student.findOne({ rollNumber: rollNumber.trim() });
    }
    if (!student && studentName) {
      student = await Student.findOne({ name: studentName.trim() });
    }

    const targetStudentId = student ? student._id : null;
    const finalStudentName = student ? student.name : studentName;
    const finalRollNumber = student ? student.rollNumber : (rollNumber || 'N/A');

    // DUPLICATE ALLOCATION GUARD: Check if student is already in another room
    if (targetStudentId) {
      const existingRoom = await Room.findOne({
        _id: { $ne: room._id },
        'occupants.studentId': targetStudentId,
      });

      if (existingRoom) {
        // Cleanly remove from previous room to prevent duplicate bed reservations
        existingRoom.occupants = existingRoom.occupants.filter(
          (o) => String(o.studentId) !== String(targetStudentId)
        );
        existingRoom.occupiedBeds = existingRoom.occupants.length;
        if (existingRoom.occupiedBeds < existingRoom.capacity && existingRoom.status === 'occupied') {
          existingRoom.status = 'available';
        }
        await existingRoom.save();
      }
    }

    // Validate bed number
    const assignedBed = bedNumber || room.occupiedBeds + 1;
    const bedTaken = room.occupants.some((o) => o.bedNumber === Number(assignedBed));
    const finalBed = bedTaken ? room.occupiedBeds + 1 : assignedBed;

    room.occupants.push({
      studentId: targetStudentId,
      name: finalStudentName,
      rollNumber: finalRollNumber,
      bedNumber: finalBed,
      allocatedAt: new Date(),
    });

    room.occupiedBeds = room.occupants.length;
    if (room.occupiedBeds >= room.capacity) {
      room.status = 'occupied';
    }

    await room.save();

    // Dual-sync: Update student document
    if (student) {
      student.roomId = room._id;
      student.roomNumber = room.roomNumber;
      student.hostelBlock = room.block;
      student.bedNumber = finalBed;
      await student.save();
    }

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'ROOM_ALLOCATED',
      targetResource: 'rooms',
      targetId: room._id.toString(),
      details: { roomNumber: room.roomNumber, studentName: finalStudentName, bedNumber: finalBed },
      req,
    });

    return res.json({ success: true, message: `Student ${finalStudentName} allocated to Room ${room.roomNumber} (Bed ${finalBed})`, room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Swap occupants between two rooms
 */
export const swapStudents = async (req, res) => {
  try {
    const { roomAId, studentAId, roomBId, studentBId } = req.body;
    if (!roomAId || !studentAId || !roomBId || !studentBId) {
      return res.status(400).json({ success: false, message: 'Both room and student identifiers are required for swap' });
    }

    const roomA = await Room.findById(roomAId);
    const roomB = await Room.findById(roomBId);
    if (!roomA || !roomB) {
      return res.status(404).json({ success: false, message: 'One or both rooms not found in database' });
    }

    const idxA = roomA.occupants.findIndex(
      (o) => String(o.studentId) === String(studentAId) || o.name === studentAId || o._id?.toString() === studentAId
    );
    const idxB = roomB.occupants.findIndex(
      (o) => String(o.studentId) === String(studentBId) || o.name === studentBId || o._id?.toString() === studentBId
    );

    if (idxA === -1 || idxB === -1) {
      return res.status(404).json({ success: false, message: 'One or both students not found in designated rooms' });
    }

    const studentA = roomA.occupants[idxA];
    const studentB = roomB.occupants[idxB];

    const bedA = studentA.bedNumber;
    const bedB = studentB.bedNumber;

    // Swap occupants
    roomA.occupants[idxA] = {
      studentId: studentB.studentId,
      name: studentB.name,
      rollNumber: studentB.rollNumber,
      bedNumber: bedA,
      allocatedAt: new Date(),
    };

    roomB.occupants[idxB] = {
      studentId: studentA.studentId,
      name: studentA.name,
      rollNumber: studentA.rollNumber,
      bedNumber: bedB,
      allocatedAt: new Date(),
    };

    await roomA.save();
    await roomB.save();

    // Dual-sync Student profiles
    if (studentA.studentId) {
      await Student.findByIdAndUpdate(studentA.studentId, {
        roomId: roomB._id,
        roomNumber: roomB.roomNumber,
        hostelBlock: roomB.block,
        bedNumber: bedB,
      });
    }

    if (studentB.studentId) {
      await Student.findByIdAndUpdate(studentB.studentId, {
        roomId: roomA._id,
        roomNumber: roomA.roomNumber,
        hostelBlock: roomA.block,
        bedNumber: bedA,
      });
    }

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'STUDENTS_SWAPPED',
      targetResource: 'rooms',
      targetId: `${roomA.roomNumber}<->${roomB.roomNumber}`,
      details: { studentA: studentA.name, studentB: studentB.name },
      req,
    });

    return res.json({ success: true, message: `Students ${studentA.name} and ${studentB.name} successfully swapped between rooms.`, roomA, roomB });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update room maintenance or availability status
 */
export const updateRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['available', 'occupied', 'maintenance'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid room status' });
    }

    const room = await Room.findByIdAndUpdate(id, { status }, { new: true });
    return res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Mess Menu
 */
export const getMessMenu = (req, res) => {
  return res.json({ success: true, messMenu: weeklyMessMenu });
};

/**
 * Get Outpasses / Leave Requests
 */
export const getLeaveRequests = async (req, res) => {
  try {
    const filter = {};
    if (req.user?.role === 'student') {
      filter.$or = [{ studentId: req.user._id }, { studentName: req.user.name }];
    }
    const outpasses = await Outpass.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, outpasses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Submit Outpass (Student request)
 */
export const applyOutpass = async (req, res) => {
  try {
    const { destination, reason, leaveDate, returnDate, emergencyContact, roomNumber } = req.body;
    if (!destination || !reason || !leaveDate || !returnDate || !emergencyContact) {
      return res.status(400).json({ success: false, message: 'All outpass application fields are required' });
    }

    const newOutpass = await Outpass.create({
      studentId: req.user._id,
      studentName: req.user.name,
      rollNumber: req.user.rollNumber || 'STU-NEW',
      roomNumber: roomNumber || req.user.roomNumber || 'A-101',
      destination,
      reason,
      leaveDate: new Date(leaveDate),
      returnDate: new Date(returnDate),
      emergencyContact,
      status: 'Pending',
      wardenRemarks: '',
    });

    return res.status(201).json({ success: true, message: 'Outpass permit submitted to Hostel Warden', outpass: newOutpass });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Review Outpass (Warden / Admin approval)
 */
export const updateOutpassStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be Approved, Rejected, or Pending.' });
    }

    const outpass = await Outpass.findByIdAndUpdate(
      id,
      {
        status,
        wardenRemarks: remarks || '',
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!outpass) {
      return res.status(404).json({ success: false, message: 'Outpass record not found' });
    }

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: `OUTPASS_${status.toUpperCase()}`,
      targetResource: 'outpasses',
      targetId: id,
      details: { studentName: outpass.studentName, remarks },
      req,
    });

    return res.json({ success: true, message: `Outpass marked as ${status}`, outpass });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Record Daily Hostel Attendance (Roll Call)
 */
export const recordHostelAttendance = async (req, res) => {
  try {
    const { studentId, studentName, rollNumber, status, date, locationOrRoute, remarks } = req.body;
    if (!studentId || !studentName) {
      return res.status(400).json({ success: false, message: 'Student ID and name are required' });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const record = await Attendance.findOneAndUpdate(
      { studentId, type: 'hostel', date: attendanceDate },
      {
        studentName,
        rollNumber: rollNumber || '',
        status: status || 'present',
        markedBy: req.user._id,
        locationOrRoute: locationOrRoute || 'Hostel Night Roll Call',
        remarks: remarks || '',
      },
      { upsert: true, new: true }
    );

    return res.json({ success: true, message: 'Hostel attendance recorded', record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
