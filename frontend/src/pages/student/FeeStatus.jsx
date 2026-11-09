import React, { useState, useEffect } from 'react';
import { transportService } from '../../services/transportService';
import { useAuth } from '../../context/AuthContext';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  Download,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { formatDate, formatCurrency, getStatusBadgeStyle } from '../../utils/validators';

const FeeStatus = () => {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pay Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI (Instant PhonePe / GPay)');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await transportService.getAllFees();
      if (res.success) {
        setFees(res.fees || []);
      }
    } catch (err) {
      console.error('Error fetching fees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const handlePayClick = (fee) => {
    setSelectedFee(fee);
    setIsPayModalOpen(true);
    setPaymentSuccessMsg('');
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedFee) return;

    setIsProcessing(true);
    try {
      const res = await transportService.payFee(selectedFee._id, paymentMethod);
      if (res.success) {
        setPaymentSuccessMsg(`Success! Payment for ${selectedFee.invoiceNumber} verified.`);
        setTimeout(() => {
          setIsPayModalOpen(false);
          setIsProcessing(false);
          fetchFees();
        }, 1200);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
      setIsProcessing(false);
    }
  };

  const totalBilled = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalPaid = fees.filter((f) => f.status === 'Paid').reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalOutstanding = totalBilled - totalPaid;

  const columns = [
    {
      header: 'Invoice # & Student',
      render: (f) => (
        <div>
          <span className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-blue-500" />
            {f.invoiceNumber}
          </span>
          <div className="text-xs text-slate-400 mt-0.5">{f.studentName} ({f.rollNumber})</div>
        </div>
      ),
    },
    {
      header: 'Fee Type',
      render: (f) => (
        <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
          {f.feeType}
        </span>
      ),
    },
    {
      header: 'Amount',
      render: (f) => (
        <span className="font-bold text-sm text-slate-900 dark:text-white">
          {formatCurrency(f.amount)}
        </span>
      ),
    },
    {
      header: 'Due Deadline',
      render: (f) => (
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          {formatDate(f.dueDate)}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (f) => (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadgeStyle(
            f.status
          )}`}
        >
          {f.status}
        </span>
      ),
    },
    {
      header: 'Payment Action',
      render: (f) => (
        <div>
          {f.status !== 'Paid' ? (
            <button
              onClick={() => handlePayClick(f)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pay Online</span>
            </button>
          ) : (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Paid via {f.paymentMethod?.split(' ')[0] || 'UPI'}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Hostel & Transport Billing Statements
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Transparent financial invoices, payment receipts, tuition dues, and online transaction portals.
          </p>
        </div>
      </div>

      {/* Top Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400">Total Billed Invoices</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatCurrency(totalBilled)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Hostel board + transport semester billing</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">Total Cleared</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(totalPaid)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Directly deposited to institutional treasury</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold uppercase text-rose-600 dark:text-rose-400">Outstanding Balance</span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {formatCurrency(totalOutstanding)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Awaiting settlement before month-end</p>
        </div>
      </div>

      {/* Billing & Invoice Tables */}
      <Table
        columns={columns}
        data={fees}
        searchPlaceholder="Search invoices by number, student name..."
      />

      {/* Pay Online Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => !isProcessing && setIsPayModalOpen(false)}
        title={`Complete Payment: ${selectedFee?.invoiceNumber}`}
      >
        {paymentSuccessMsg ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Payment Verified!</h4>
            <p className="text-xs text-slate-500">{paymentSuccessMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleProcessPayment} className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Particulars:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedFee?.feeType}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Student Roll:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedFee?.rollNumber}</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-700 font-bold">
                <span className="text-slate-800 dark:text-slate-200">Total Payable:</span>
                <span className="text-base text-blue-600 dark:text-blue-400">{formatCurrency(selectedFee?.amount)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Payment Channel
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="UPI (Instant PhonePe / GPay / Paytm)">UPI (Instant PhonePe / GPay / Paytm)</option>
                <option value="NetBanking (HDFC / ICICI / SBI)">NetBanking (HDFC / ICICI / SBI)</option>
                <option value="Credit / Debit Card (Visa / Mastercard)">Credit / Debit Card (Visa / Mastercard)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Simulated 256-bit Encrypted Banking Gateway</span>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authorizing...</span>
                  </>
                ) : (
                  <>
                    <span>Authorize {formatCurrency(selectedFee?.amount)}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default FeeStatus;

