import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    feeType: {
      type: String,
      enum: ['Hostel Fee', 'Transport Fee', 'Mess Dues', 'Caution Deposit', 'All-Inclusive'],
      default: 'Hostel Fee',
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Fee amount cannot be negative'],
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Paid', 'Pending', 'Overdue'],
      default: 'Pending',
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    paymentMethod: {
      type: String,
      default: 'Online NetBanking / UPI',
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    transactionReference: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

feeSchema.index({ studentId: 1, status: 1 });
feeSchema.index({ rollNumber: 1, status: 1 });

const Fee = mongoose.models.Fee || mongoose.model('Fee', feeSchema);
export default Fee;
