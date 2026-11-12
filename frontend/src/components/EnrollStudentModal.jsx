import React, { useState } from 'react';
import Modal from './Modal';
import authService from '../services/authService';
import {
  UserPlus,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  BedDouble,
  ShieldCheck,
  User,
  Phone,
  Mail,
  Lock,
} from 'lucide-react';

const EnrollStudentModal = ({
  isOpen,
  onClose,
  onSuccess,
  defaultHostelBlock = 'Block A',
  defaultRoomNumber = '',
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    rollNumber: '',
    course: 'Computer Science & Engineering',
    year: 1,
    semester: 1,
    hostelBlock: defaultHostelBlock,
    roomNumber: defaultRoomNumber,
    bedNumber: 1,
    parentName: '',
    parentPhone: '',
    bloodGroup: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError('Full name, email address, and initial password are required.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.createUser({
        ...formData,
        role: 'student', // Wardens only create student accounts
      });

      if (res.success) {
        setSuccessMsg(`Student ${formData.name} successfully enrolled and authorized!`);
        setTimeout(() => {
          setSuccessMsg('');
          onSuccess?.(res.user);
          onClose();
        }, 1500);
      } else {
        setError(res.message || 'Failed to enroll student');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Server error while enrolling student');
    } finally {
      setLoading(false);
    }
  };

  const labelClass = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1';
  const inputClass =
    'w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hostel Warden: Enroll New Student"
      maxWidth="max-w-xl"
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>
            Students enrolled by hostel wardens are automatically approved, activated, and linked to your hostel record.
          </span>
        </div>

        {/* Basic Information */}
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Student Identity & Account
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Full Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Tariq Mehmood"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Email Address *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="student@school.edu"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Initial Password *</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Contact Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+92 345 1234567"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Academic Details */}
        <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Academic & Roll Information
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Roll Number</label>
              <input
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                placeholder="uobsac-2024-999 (auto if empty)"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Degree Program / Course</label>
              <input
                type="text"
                name="course"
                value={formData.course}
                onChange={handleChange}
                placeholder="e.g. BS Software Engineering"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Hostel Quarters Allocation */}
        <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Hostel Quarters Allocation
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Hostel Block</label>
              <select
                name="hostelBlock"
                value={formData.hostelBlock}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="Block A">Block A</option>
                <option value="Block B">Block B</option>
                <option value="Block C">Block C</option>
                <option value="Block D">Block D</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Room Number</label>
              <input
                type="text"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleChange}
                placeholder="e.g. 101, 102"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Bed Number</label>
              <select
                name="bedNumber"
                value={formData.bedNumber}
                onChange={handleChange}
                className={inputClass}
              >
                <option value={1}>Bed 1</option>
                <option value={2}>Bed 2</option>
                <option value={3}>Bed 3</option>
                <option value={4}>Bed 4</option>
              </select>
            </div>
          </div>
        </div>

        {/* Guardian Contact Details */}
        <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Parent / Guardian Details
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Parent / Guardian Name</label>
              <input
                type="text"
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                placeholder="e.g. Mohammad Ali"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Parent Contact Phone</label>
              <input
                type="tel"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                placeholder="+92 300 9876543"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/25 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Enroll Student</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EnrollStudentModal;
