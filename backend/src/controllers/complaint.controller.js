import Complaint from '../models/Complaint.model.js';
import { recordAuditLog } from '../services/audit.service.js';

export const getAllComplaints = async (req, res) => {
  try {
    const filter = {};
    if (req.user?.role === 'student') {
      filter.$or = [
        { studentId: req.user._id },
        { studentName: req.user.name },
      ];
    }
    const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createComplaint = async (req, res) => {
  try {
    const { category, title, description, priority, roomNumber, studentName } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const finalStudentName = (studentName && studentName.trim()) || req.user?.name || 'Student';

    const newComplaint = await Complaint.create({
      studentId: req.user?._id || null,
      studentName: finalStudentName,
      roomNumber: roomNumber || req.user?.roomNumber || 'Unassigned',
      category: category || 'Plumbing',
      title: title.trim(),
      description: description.trim(),
      priority: priority || 'Medium',
      status: 'Pending',
      resolutionNotes: '',
    });

    return res.status(201).json({ success: true, message: 'Complaint filed successfully', complaint: newComplaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;
    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      {
        status,
        resolutionNotes: resolutionNotes || '',
        resolvedBy: req.user._id,
        resolvedAt: status === 'Resolved' ? new Date() : null,
      },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint ticket not found' });
    }

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: `COMPLAINT_STATUS_${status.toUpperCase()}`,
      targetResource: 'complaints',
      targetId: id,
      details: { title: complaint.title, status, resolutionNotes },
      req,
    });

    return res.json({ success: true, message: `Complaint status updated to ${status}`, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
