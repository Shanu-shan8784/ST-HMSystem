import User from '../models/User.model.js';
import Admin from '../models/Admin.model.js';
import Warden from '../models/Warden.model.js';
import Driver from '../models/Driver.model.js';
import Student from '../models/Student.model.js';
import { createTokenPair, rotateRefreshToken, revokeRefreshToken, revokeAllSessions } from '../services/token.service.js';
import { recordAuditLog } from '../services/audit.service.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

/**
 * User Login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please verify your credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Contact system administrator.' });
    }

    // Student approval gate
    if (user.role === 'student' && user.approvalStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: user.approvalStatus === 'rejected'
          ? `Enrollment rejected: ${user.rejectionReason || 'Contact school administrator.'}`
          : 'Your student account is pending administrator approval before you can log in.',
        approvalStatus: user.approvalStatus,
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT Access + Refresh token pair with DB session
    const { accessToken, refreshToken } = await createTokenPair(
      user,
      req.headers['user-agent'],
      req.headers['x-forwarded-for'] || req.socket.remoteAddress
    );

    // Set refresh token in secure HttpOnly cookie
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    await recordAuditLog({
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: 'USER_LOGIN',
      targetResource: 'users',
      targetId: user._id.toString(),
      req,
    });

    return res.json({
      success: true,
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        approvalStatus: user.approvalStatus,
        rollNumber: user.rollNumber || '',
        roomNumber: user.roomNumber || '',
        hostelBlock: user.hostelBlock || '',
        busRouteId: user.busRouteId || '',
        busStop: user.busStop || '',
        assignedVehicle: user.assignedVehicle || '',
        licenseNumber: user.licenseNumber || '',
        department: user.department || '',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during authentication' });
  }
};

/**
 * Public Registration - Strictly for Students only.
 * Always creates accounts in 'pending' approval status.
 */
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      rollNumber,
      course,
      hostelBlock,
      parentName,
      parentPhone,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: cleanEmail });
    if (exists) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists' });
    }

    // Public registration only creates Student accounts
    const newStudent = await Student.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: 'student',
      approvalStatus: 'pending',
      phone: phone || '',
      rollNumber: rollNumber || `STU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      course: course || 'General Studies',
      hostelBlock: hostelBlock || 'Block A',
      parentName: parentName || '',
      parentPhone: parentPhone || '',
    });

    await recordAuditLog({
      userId: newStudent._id,
      userEmail: newStudent.email,
      userRole: 'student',
      action: 'STUDENT_SELF_REGISTERED',
      targetResource: 'users',
      targetId: newStudent._id.toString(),
      details: { rollNumber: newStudent.rollNumber, approvalStatus: 'pending' },
      req,
    });

    // Enterprise rule: Pending students do not get an immediate login session
    return res.status(201).json({
      success: true,
      pendingApproval: true,
      message: 'Student account registration submitted successfully. Your account is pending administrator approval before you can sign in.',
      user: {
        id: newStudent._id,
        name: newStudent.name,
        email: newStudent.email,
        role: 'student',
        approvalStatus: 'pending',
        rollNumber: newStudent.rollNumber,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message || 'Registration processing error' });
  }
};

/**
 * Token Refresh via HttpOnly Cookie (Silent Refresh)
 */
export const refreshSession = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token provided' });
    }

    const { accessToken, refreshToken: newRefreshToken } = await rotateRefreshToken(
      refreshToken,
      req.headers['user-agent'],
      req.headers['x-forwarded-for'] || req.socket.remoteAddress
    );

    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

    return res.json({
      success: true,
      token: accessToken,
    });
  } catch (error) {
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    return res.status(401).json({ success: false, message: error.message });
  }
};

/**
 * User Logout
 */
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Current Authenticated Profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found in database' });
    return res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Get All Pending Students for Approval
 */
export const getPendingStudents = async (req, res) => {
  try {
    const pendingStudents = await Student.find({ role: 'student', approvalStatus: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });

    return res.json({ success: true, pendingStudents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Approve or Reject a Student
 */
export const reviewStudentApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be either approved or rejected' });
    }

    const student = await Student.findById(id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student account not found' });
    }

    student.approvalStatus = status;
    student.approvedBy = req.user._id;
    student.approvalDate = new Date();
    if (status === 'rejected') {
      student.rejectionReason = rejectionReason || 'Registration application declined by administrator.';
    }
    await student.save();

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: status === 'approved' ? 'STUDENT_APPROVED' : 'STUDENT_REJECTED',
      targetResource: 'users',
      targetId: student._id.toString(),
      details: { rollNumber: student.rollNumber, rejectionReason },
      req,
    });

    return res.json({
      success: true,
      message: `Student account ${student.name} marked as ${status}.`,
      student,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * User Creation Authority: Admin creates Warden, Driver, Student, Admin; Warden creates Students.
 */
export const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'student',
      phone,
      rollNumber,
      roomNumber,
      hostelBlock,
      bedNumber,
      course,
      year,
      semester,
      busRouteId,
      busStop,
      parentName,
      parentPhone,
      parentEmail,
      bloodGroup,
      licenseNumber,
      assignedVehicle,
      assignedRoute,
      dutyStatus,
      experienceYears,
      employeeId,
      department,
      designation,
      assignedBlocks,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    // Role-based privilege enforcement: Wardens can ONLY create Students
    if (req.user.role === 'warden' && role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Wardens are strictly authorized to enroll Student accounts only.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: cleanEmail });
    if (exists) {
      return res.status(400).json({ success: false, message: 'A user with this email address already exists' });
    }

    let newUser;
    if (role === 'admin') {
      newUser = await Admin.create({
        name: name.trim(),
        email: cleanEmail,
        password,
        phone: phone || '',
        role: 'admin',
        approvalStatus: 'approved',
        employeeId: employeeId || `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
        department: department || 'Campus Administration',
        designation: designation || 'Administrator',
      });
    } else if (role === 'warden') {
      newUser = await Warden.create({
        name: name.trim(),
        email: cleanEmail,
        password,
        phone: phone || '',
        role: 'warden',
        approvalStatus: 'approved',
        employeeId: employeeId || `WRD-${Math.floor(1000 + Math.random() * 9000)}`,
        hostelBlock: hostelBlock || 'Block A',
        assignedBlocks: assignedBlocks || [hostelBlock || 'Block A'],
      });
    } else if (role === 'driver') {
      newUser = await Driver.create({
        name: name.trim(),
        email: cleanEmail,
        password,
        phone: phone || '',
        role: 'driver',
        approvalStatus: 'approved',
        licenseNumber: licenseNumber || `LIC-${Math.floor(10000 + Math.random() * 90000)}`,
        assignedVehicle: assignedVehicle || '',
        assignedRoute: assignedRoute || '',
        dutyStatus: dutyStatus || 'On Duty',
        experienceYears: experienceYears || 1,
      });
    } else {
      // Student account created by Admin or Warden -> auto-approved and authorized
      newUser = await Student.create({
        name: name.trim(),
        email: cleanEmail,
        password,
        phone: phone || '',
        role: 'student',
        approvalStatus: 'approved',
        approvedBy: req.user._id,
        approvalDate: new Date(),
        rollNumber: rollNumber || `STU-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        course: course || 'General Studies',
        year: year || 1,
        semester: semester || 1,
        roomNumber: roomNumber || 'Unassigned',
        hostelBlock: hostelBlock || req.user.hostelBlock || 'Block A',
        bedNumber: bedNumber || 1,
        busRouteId: busRouteId || '',
        busStop: busStop || '',
        parentName: parentName || '',
        parentPhone: parentPhone || '',
        parentEmail: parentEmail || '',
        bloodGroup: bloodGroup || '',
      });
    }

    const isWarden = req.user.role === 'warden';
    const auditAction = isWarden ? 'WARDEN_CREATED_STUDENT' : 'ADMIN_CREATED_USER';
    const creatorTitle = isWarden ? 'Hostel Warden' : 'Administrator';

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: auditAction,
      targetResource: 'users',
      targetId: newUser._id.toString(),
      details: { role, targetEmail: cleanEmail, createdBy: req.user.role },
      req,
    });

    return res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully by ${creatorTitle}`,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        approvalStatus: newUser.approvalStatus,
        rollNumber: newUser.rollNumber || '',
        licenseNumber: newUser.licenseNumber || '',
        hostelBlock: newUser.hostelBlock || '',
        roomNumber: newUser.roomNumber || '',
        employeeId: newUser.employeeId || '',
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Users Directory (Admin sees all; Warden sees students)
 */
export const getAllUsers = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'warden') {
      filter = { role: 'student' };
    }
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    return res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Delete User
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (String(id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Administrators cannot delete their own active account' });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    await revokeAllSessions(id);
    await User.findByIdAndDelete(id);

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'ADMIN_DELETED_USER',
      targetResource: 'users',
      targetId: id,
      details: { deletedEmail: targetUser.email, deletedRole: targetUser.role },
      req,
    });

    return res.json({ success: true, message: `Account '${targetUser.name}' removed from database` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * One-Time Admin Setup Endpoint (Disabled: Master admin is initialized once directly in MongoDB from the backend)
 */
export const setupAdmin = async (req, res) => {
  return res.status(403).json({
    success: false,
    message:
      'Public admin registration is strictly disabled. Master Admin is provisioned automatically once in MongoDB Atlas on backend startup.',
  });
};
