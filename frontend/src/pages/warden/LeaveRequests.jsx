import React, { useState, useEffect } from 'react';
import { hostelService } from '../../services/hostelService';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { toast } from 'react-toastify';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Calendar,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { formatDateTime, getStatusBadgeStyle } from '../../utils/validators';

const LeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState('Approved');
  const [remarks, setRemarks] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await hostelService.getLeaveRequests();
      if (res.success) {
        setRequests(res.outpasses);
      }
    } catch (err) {
      console.error('Error fetching outpasses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openReviewModal = (req, action) => {
    setSelectedRequest(req);
    setReviewAction(action);
    setRemarks(
      action === 'Approved'
        ? 'Approved by Warden. Please return before the designated hour.'
        : 'Guardian approval required.'
    );
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      const res = await hostelService.updateOutpassStatus(
        selectedRequest._id,
        reviewAction,
        remarks
      );
      if (res.success) {
        setIsReviewModalOpen(false);
        fetchRequests();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const filteredRequests =
    filterStatus === 'All'
      ? requests
      : requests.filter((r) => r.status?.toLowerCase() === filterStatus.toLowerCase());

  const columns = [
    {
      header: 'Student & Room',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">{r.studentName}</div>
          <div className="text-xs text-slate-400">
            Room: <span className="font-mono text-slate-700 dark:text-slate-300">{r.roomNumber}</span> &bull; {r.rollNumber || 'STU'}
          </div>
        </div>
      ),
    },
    {
      header: 'Destination & Reason',
      render: (r) => (
        <div className="max-w-xs">
          <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{r.destination}</div>
          <div className="text-xs text-slate-400 truncate">{r.reason}</div>
        </div>
      ),
    },
    {
      header: 'Departure & Return',
      render: (r) => (
        <div className="text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1 text-slate-500">
            <span className="font-bold text-slate-700 dark:text-slate-300">Out:</span> {formatDateTime(r.leaveDate)}
          </div>
          <div className="flex items-center gap-1 text-slate-500 mt-0.5">
            <span className="font-bold text-slate-700 dark:text-slate-300">In:</span> {formatDateTime(r.returnDate)}
          </div>
        </div>
      ),
    },
    {
      header: 'Emergency Contact',
      render: (r) => (
        <a
          href={`tel:${r.emergencyContact}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline"
        >
          <Phone className="w-3.5 h-3.5" />
          {r.emergencyContact}
        </a>
      ),
    },
    {
      header: 'Status',
      render: (r) => (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadgeStyle(
            r.status
          )}`}
        >
          {r.status}
        </span>
      ),
    },
    {
      header: 'Warden Actions',
      render: (r) => (
        <div className="flex items-center gap-1.5">
          {r.status === 'Pending' ? (
            <>
              <button
                onClick={() => openReviewModal(r, 'Approved')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Approve Outpass"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
              <button
                onClick={() => openReviewModal(r, 'Rejected')}
                className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Reject Outpass"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-400 italic">
              {r.wardenRemarks ? `"${r.wardenRemarks}"` : 'Decided'}
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
            Student Leave & Outpass Tracker
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review digital outpass applications, check guardian emergency contacts, and log authorized leaves.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto border border-slate-200 dark:border-slate-700">
          {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === status
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={filteredRequests}
        searchPlaceholder="Search by student, room, or destination..."
      />

      {/* Review Outpass Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`${reviewAction} Outpass for ${selectedRequest?.studentName}`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <div>
              <span className="font-semibold text-slate-400">Destination:</span>{' '}
              <span className="text-slate-800 dark:text-slate-200 font-bold">{selectedRequest?.destination}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-400">Reason:</span>{' '}
              <span className="text-slate-800 dark:text-slate-200">{selectedRequest?.reason}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-400">Guardian Contact:</span>{' '}
              <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{selectedRequest?.emergencyContact}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Warden Remarks / Instructions
            </label>
            <textarea
              rows={3}
              required
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-sm ${
                reviewAction === 'Approved'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              Confirm {reviewAction}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeaveRequests;

