import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { hostelService } from '../../services/hostelService';
import { outpassSchema, formatDateTime, getStatusBadgeStyle } from '../../utils/validators';
import {
  FileText,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Phone,
  Calendar,
} from 'lucide-react';

const OutpassForm = () => {
  const { user } = useAuth();
  const [myOutpasses, setMyOutpasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    destination: '',
    reason: '',
    leaveDate: '',
    returnDate: '',
    emergencyContact: user?.parentPhone || '+91 98765 11111',
    roomNumber: user?.roomNumber || 'A-101',
  });

  const fetchOutpasses = async () => {
    try {
      setLoading(true);
      const res = await hostelService.getLeaveRequests();
      if (res.success) {
        setMyOutpasses(res.outpasses || []);
      }
    } catch (err) {
      console.error('Error fetching outpasses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutpasses();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Zod validation
    const validation = outpassSchema.safeParse(formData);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Please check form fields');
      return;
    }

    if (new Date(formData.returnDate) <= new Date(formData.leaveDate)) {
      setError('Return date must be after departure leave date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await hostelService.applyOutpass(formData);
      if (res.success) {
        setSuccessMsg('Outpass application successfully submitted! Awaiting warden approval.');
        setFormData({
          destination: '',
          reason: '',
          leaveDate: '',
          returnDate: '',
          emergencyContact: user?.parentPhone || '+92 3493002849',
          roomNumber: user?.roomNumber || 'A-101',
        });
        fetchOutpasses();
      } else {
        setError(res.message || 'Failed to submit outpass');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      case 'pending':
      default:
        return <Clock className="w-5 h-5 text-amber-500 shrink-0 animate-pulse" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Hostel Outpass Application & Status Tracker
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Request official leaves, campus exit permits, and monitor real-time approval status from wardens.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Digital Outpass Application Form */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Apply for Leave / Outpass
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Destination Address / City
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  name="destination"
                  required
                  placeholder="e.g. Home, Connaught Place, New Delhi"
                  value={formData.destination}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Leave
              </label>
              <textarea
                name="reason"
                required
                rows={2}
                placeholder="Family function / medical appointment / weekend home visit"
                value={formData.reason}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Departure Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="leaveDate"
                  required
                  value={formData.leaveDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expected Return Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="returnDate"
                  required
                  value={formData.returnDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Guardian Emergency Contact
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="tel"
                  name="emergencyContact"
                  required
                  placeholder="+91 98765 00000"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Outpass Request</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Personal Outpass History & Status Tracker */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Application History & Live Status Tracker
            </h2>
            <span className="text-xs text-slate-400">
              {myOutpasses.length} applications logged
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-400">Loading outpass history...</div>
          ) : myOutpasses.length > 0 ? (
            <div className="space-y-3">
              {myOutpasses.map((op) => (
                <div
                  key={op._id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(op.status)}
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {op.destination}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{op.reason}</p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${getStatusBadgeStyle(
                        op.status
                      )}`}
                    >
                      {op.status}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400">Departure:</span>{' '}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatDateTime(op.leaveDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Return:</span>{' '}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatDateTime(op.returnDate)}
                      </span>
                    </div>
                  </div>

                  {/* Warden Remarks if any */}
                  {op.wardenRemarks && (
                    <div className="text-xs p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200">
                      <strong>Warden Note:</strong> {op.wardenRemarks}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              No outpass applications submitted yet. Fill the form on the left to request your first permit.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutpassForm;

