import React, { useState, useEffect } from 'react';
import { hostelService } from '../../services/hostelService';
import { useAuth } from '../../context/AuthContext';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import {
  AlertCircle,
  PlusCircle,
  Wrench,
  Wifi,
  Zap,
  Droplets,
  Brush,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { formatDateTime, getStatusBadgeStyle } from '../../utils/validators';

const Complaints = () => {
  const { user, role } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // New Complaint Modal State
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    studentName: user?.name || '',
    category: 'Plumbing',
    title: '',
    description: '',
    priority: 'Medium',
    roomNumber: user?.roomNumber || '',
  });

  // Resolve Modal State for Warden/Admin
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [resolveForm, setResolveForm] = useState({
    status: 'In Progress',
    resolutionNotes: '',
  });

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await hostelService.getComplaints();
      if (res.success) {
        setComplaints(res.complaints);
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    if (user?.name) {
      setSubmitForm((prev) => ({
        ...prev,
        studentName: prev.studentName || user.name,
        roomNumber: prev.roomNumber || user.roomNumber || '',
      }));
    }
  }, [user]);

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    try {
      const res = await hostelService.createComplaint(submitForm);
      if (res.success) {
        setIsSubmitOpen(false);
        setSubmitForm({
          studentName: user?.name || '',
          category: 'Plumbing',
          title: '',
          description: '',
          priority: 'Medium',
          roomNumber: user?.roomNumber || '',
        });
        fetchComplaints();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    try {
      const res = await hostelService.updateComplaintStatus(
        selectedComplaint._id,
        resolveForm.status,
        resolveForm.resolutionNotes
      );
      if (res.success) {
        setIsResolveOpen(false);
        fetchComplaints();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const filteredComplaints =
    selectedCategory === 'All'
      ? complaints
      : complaints.filter((c) => c.category?.toLowerCase() === selectedCategory.toLowerCase());

  const getCategoryIcon = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'wi-fi':
        return <Wifi className="w-3.5 h-3.5 text-blue-500" />;
      case 'plumbing':
        return <Droplets className="w-3.5 h-3.5 text-cyan-500" />;
      case 'electrical':
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case 'cleaning':
        return <Brush className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <Wrench className="w-3.5 h-3.5 text-purple-500" />;
    }
  };

  const columns = [
    {
      header: 'Issue & Category',
      render: (c) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            {getCategoryIcon(c.category)}
            <span>{c.title}</span>
          </div>
          <div className="text-xs text-slate-400 max-w-sm line-clamp-1 mt-0.5">
            {c.description}
          </div>
        </div>
      ),
    },
    {
      header: 'Room & Student',
      render: (c) => (
        <div className="text-xs text-slate-700 dark:text-slate-300">
          <div className="font-bold">Room {c.roomNumber}</div>
          <div className="text-slate-400">{c.studentName}</div>
        </div>
      ),
    },
    {
      header: 'Priority',
      render: (c) => (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
            c.priority === 'Urgent' || c.priority === 'High'
              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
              : c.priority === 'Medium'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {c.priority}
        </span>
      ),
    },
    {
      header: 'Filed On',
      render: (c) => (
        <span className="text-xs text-slate-400">{formatDateTime(c.createdAt)}</span>
      ),
    },
    {
      header: 'Status',
      render: (c) => (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadgeStyle(
            c.status
          )}`}
        >
          {c.status}
        </span>
      ),
    },
    {
      header: 'Resolution / Action',
      render: (c) => (
        <div>
          {role === 'warden' || role === 'admin' ? (
            <button
              onClick={() => {
                setSelectedComplaint(c);
                setResolveForm({
                  status: c.status === 'Resolved' ? 'Resolved' : 'In Progress',
                  resolutionNotes: c.resolutionNotes || '',
                });
                setIsResolveOpen(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
            >
              Update Status
            </button>
          ) : (
            <span className="text-xs text-slate-500 italic">
              {c.resolutionNotes || (c.status === 'Pending' ? 'Assigned to warden' : 'Under inspection')}
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
            Hostel Maintenance Complaint Box
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Submit hostel infrastructure tickets (plumbing, Wi-Fi, electricity) and track resolution life cycle.
          </p>
        </div>

        <button
          onClick={() => setIsSubmitOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>File Maintenance Complaint</span>
        </button>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', 'Plumbing', 'Wi-Fi', 'Electrical', 'Carpentry', 'Cleaning', 'Other'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Complaints Table */}
      <Table
        columns={columns}
        data={filteredComplaints}
        searchPlaceholder="Search complaints by title, room, or student..."
      />

      {/* File Complaint Modal */}
      <Modal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        title="File Hostel Maintenance Issue"
      >
        <form onSubmit={handleSubmitComplaint} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={submitForm.category}
                onChange={(e) => setSubmitForm({ ...submitForm, category: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="Plumbing">Plumbing</option>
                <option value="Wi-Fi">Wi-Fi & Internet</option>
                <option value="Electrical">Electrical / Appliances</option>
                <option value="Carpentry">Carpentry & Furniture</option>
                <option value="Cleaning">Sanitation & Cleaning</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={submitForm.priority}
                onChange={(e) => setSubmitForm({ ...submitForm, priority: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Student Name *
              </label>
              <input
                type="text"
                required
                placeholder="Enter student name"
                value={submitForm.studentName}
                onChange={(e) => setSubmitForm({ ...submitForm, studentName: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Room Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. A-101"
                value={submitForm.roomNumber}
                onChange={(e) => setSubmitForm({ ...submitForm, roomNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Issue Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Geyser tripping circuit breaker"
              value={submitForm.title}
              onChange={(e) => setSubmitForm({ ...submitForm, title: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Detailed Description
            </label>
            <textarea
              rows={3}
              required
              placeholder="Provide exact details of the issue..."
              value={submitForm.description}
              onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSubmitOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              Submit Ticket
            </button>
          </div>
        </form>
      </Modal>

      {/* Resolve Complaint Modal */}
      <Modal
        isOpen={isResolveOpen}
        onClose={() => setIsResolveOpen(false)}
        title={`Update Complaint Status: ${selectedComplaint?.title}`}
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status State
            </label>
            <select
              value={resolveForm.status}
              onChange={(e) => setResolveForm({ ...resolveForm, status: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Warden / Technician Resolution Notes
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Electrician visited and replaced the fuse."
              value={resolveForm.resolutionNotes}
              onChange={(e) => setResolveForm({ ...resolveForm, resolutionNotes: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsResolveOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              Save Status
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Complaints;

