import Fee from '../models/Fee.model.js';
import User from '../models/User.model.js';
import { recordAuditLog } from '../services/audit.service.js';

/**
 * Get All Fees (Admin & Warden view)
 */
export const getAllFees = async (req, res) => {
  try {
    const filter = {};
    if (req.user?.role === 'student') {
      filter.$or = [
        { studentId: req.user._id },
        { rollNumber: req.user.rollNumber },
        { studentName: req.user.name },
      ];
    }

    const fees = await Fee.find(filter).sort({ dueDate: 1 });
    return res.json({ success: true, fees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Current Student's Fees
 */
export const getStudentFees = async (req, res) => {
  try {
    const studentId = req.user._id;
    const fees = await Fee.find({
      $or: [
        { studentId },
        { rollNumber: req.user.rollNumber },
        { studentName: req.user.name },
      ],
    }).sort({ dueDate: 1 });

    return res.json({ success: true, fees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create Fee Invoice (Admin / Warden)
 */
export const createFee = async (req, res) => {
  try {
    const { studentId, studentName, rollNumber, feeType, amount, dueDate } = req.body;
    if (!studentName || !amount || !dueDate) {
      return res.status(400).json({ success: false, message: 'Student name, amount, and due date are required' });
    }

    let targetStudentId = studentId || null;
    if (!targetStudentId && rollNumber) {
      const studentUser = await User.findOne({ rollNumber: rollNumber.trim() });
      if (studentUser) targetStudentId = studentUser._id;
    }

    const fee = await Fee.create({
      studentId: targetStudentId,
      studentName: studentName.trim(),
      rollNumber: rollNumber || 'STU-NEW',
      feeType: feeType || 'Hostel Fee',
      amount: Number(amount),
      dueDate: new Date(dueDate),
      status: 'Pending',
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    });

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'FEE_INVOICE_GENERATED',
      targetResource: 'fees',
      targetId: fee._id.toString(),
      details: { invoiceNumber: fee.invoiceNumber, amount: fee.amount, studentName: fee.studentName },
      req,
    });

    return res.status(201).json({ success: true, fee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Process Fee Payment (Guarded against IDOR/BOLA)
 */
export const payFee = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod = 'Online NetBanking / UPI', transactionReference } = req.body;

    const fee = await Fee.findById(id);
    if (!fee) return res.status(404).json({ success: false, message: 'Fee invoice not found in database' });

    // IDOR PROTECTION: If student, verify that the invoice belongs to this student
    if (req.user?.role === 'student') {
      const isOwner =
        (fee.studentId && String(fee.studentId) === String(req.user._id)) ||
        (fee.rollNumber && fee.rollNumber === req.user.rollNumber) ||
        fee.studentName === req.user.name;

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You cannot make payments on an invoice belonging to another student',
        });
      }
    }

    fee.status = 'Paid';
    fee.paymentDate = new Date();
    fee.paymentMethod = paymentMethod;
    fee.paidBy = req.user._id;
    fee.transactionReference = transactionReference || `TXN-${Date.now()}`;
    await fee.save();

    await recordAuditLog({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'FEE_PAYMENT_PROCESSED',
      targetResource: 'fees',
      targetId: fee._id.toString(),
      details: { invoiceNumber: fee.invoiceNumber, amount: fee.amount, paymentMethod },
      req,
    });

    return res.json({ success: true, message: `Payment for invoice ${fee.invoiceNumber} recorded successfully.`, fee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
