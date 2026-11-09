import React, { useState, useEffect } from 'react';
import authService from '../../services/authService';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import {
  UserPlus,
  Trash2,
  Shield,
  User,
  Bus,
  Building2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
} from 'lucide-react';
import { getStatusBadgeStyle, formatDate } from '../../utils/validators';

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'pending'
  const [users, setUsers] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [filterRole, setFilterRole] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    phone: '',
    // Student fields
    rollNumber: '',
    course: '',
    roomNumber: '',
    hostelBlock: '',
    parentName: '',
    parentPhone: '',
    // Warden fields
    employeeId: '',
    // Driver fields
    licenseNumber: '',
    assignedVehicle: '',
    // Admin fields
    department: '',
    designation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, pendingRes] = await Promise.allSettled([
        authService.getAllUsers(),
        authService.getPendingStudents(),
      ]);

      if (usersRes.status === 'fulfilled' && usersRes.value.success) {
        setUsers(usersRes.value.users);
      }
      if (pendingRes.status === 'fulfilled' && pendingRes.value.success) {
        setPendingStudents(pendingRes.value.pendingStudents);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'student',
      phone: '',
      rollNumber: '',
      course: '',
      roomNumber: '',
      hostelBlock: '',
      parentName: '',
      parentPhone: '',
      employeeId: '',
      licenseNumber: '',
      assignedVehicle: '',
      department: '',
      designation: '',
    });
    setError('');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await authService.createUser(formData);
      if (res.success) {
        setIsModalOpen(false);
        resetForm();
        setActionSuccess(`Account for ${formData.name} created successfully.`);
        setTimeout(() => setActionSuccess(''), 4000);
        fetchData();
      } else {
        setError(res.message || 'Failed to create user');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this user account?')) {
      try {
        await authService.deleteUser(id);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || err.message);
      }
    }
  };

  const handleApprove = async (studentId, studentName) => {
    try {
      const res = await authService.approveStudent(studentId, 'approved');
      if (res.success) {
        setActionSuccess(`Student ${studentName} successfully approved and activated.`);
        setTimeout(() => setActionSuccess(''), 4000);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleReject = async (studentId, studentName) => {
    const reason = window.prompt(`Provide reason for declining ${studentName}'s enrollment:`, 'Incomplete documentation');
    if (reason === null) return;

    try {
      const res = await authService.approveStudent(studentId, 'rejected', reason);
      if (res.success) {
        setActionSuccess(`Student ${studentName} application marked as rejected.`);
        setTimeout(() => setActionSuccess(''), 4000);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const filteredUsers = filterRole === 'all' ? users : users.filter((u) => u.role === filterRole);

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'warden':
        return <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'driver':
        return <Bus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      default:
        return <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const columns = [
    {
      header: 'Name & Contact',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
            {u.name?.[0] || 'U'}
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{u.name}</span>
              {u.approvalStatus === 'pending' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                  Pending
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400">{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      render: (u) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {getRoleIcon(u.role)}
          {u.role}
        </span>
      ),
    },
    {
      header: 'Identifier / Roll No',
      render: (u) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {u.rollNumber || u.licenseNumber || u.employeeId || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Hostel / Route / Dept',
      render: (u) => (
        <div className="text-xs text-slate-600 dark:text-slate-300">
          {u.roomNumber ? `Room ${u.roomNumber}` : u.hostelBlock || u.assignedVehicle || u.department || 'Unassigned'}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (u) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            u.approvalStatus === 'pending'
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
              : u.approvalStatus === 'rejected'
              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {u.approvalStatus || 'approved'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (u) => (
        <button
          onClick={() => handleDelete(u._id || u.id)}
          className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          title="Delete User"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const pendingColumns = [
    {
      header: 'Student Name & Email',
      render: (s) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white">{s.name}</div>
          <div className="text-xs text-slate-400">{s.email}</div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">{s.phone || 'No phone'}</div>
        </div>
      ),
    },
    {
      header: 'Roll Number',
      render: (s) => (
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
          {s.rollNumber}
        </span>
      ),
    },
    {
      header: 'Course & Block',
      render: (s) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800 dark:text-slate-200">{s.course}</div>
          <div className="text-slate-400">{s.hostelBlock}</div>
        </div>
      ),
    },
    {
      header: 'Parent Info',
      render: (s) => (
        <div className="text-xs text-slate-600 dark:text-slate-400">
          <div>{s.parentName || 'N/A'}</div>
          <div>{s.parentPhone || ''}</div>
        </div>
      ),
    },
    {
      header: 'Submitted',
      render: (s) => <span className="text-xs text-slate-400">{formatDate(s.createdAt)}</span>,
    },
    {
      header: 'Decision',
      render: (s) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleApprove(s._id, s.name)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Approve</span>
          </button>
          <button
            onClick={() => handleReject(s._id, s.name)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject</span>
          </button>
        </div>
      ),
    },
  ];

  const inputClass =
    'w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none';
  const labelClass = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            User Directory & Access Control
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Administrative authority to verify student registrations, provision staff, and manage institutional accounts.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New Account</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Tabs: User Directory vs Pending Approvals */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'directory'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Active User Directory ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 relative ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Student Approval Queue</span>
          {pendingStudents.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
              {pendingStudents.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'directory' ? (
        <>
          {/* Role filter buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['all', 'student', 'warden', 'driver', 'admin'].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                  filterRole === r
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {r === 'all' ? 'All Roles' : `${r}s`}
              </button>
            ))}
          </div>

          {/* Stats summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Users', value: users.length, color: 'text-slate-700 dark:text-white' },
              { label: 'Students', value: users.filter((u) => u.role === 'student').length, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Wardens', value: users.filter((u) => u.role === 'warden').length, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Drivers', value: users.filter((u) => u.role === 'driver').length, color: 'text-amber-600 dark:text-amber-400' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Users Table */}
          <Table
            columns={columns}
            data={filteredUsers}
            searchPlaceholder="Filter by name, email, roll no, or role..."
          />
        </>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
            ℹ️ Students who register via the public enrollment portal must be verified and approved by an administrator before they are permitted to log in or access school facilities.
          </div>

          <Table
            columns={pendingColumns}
            data={pendingStudents}
            searchPlaceholder="Filter pending enrollments..."
          />
        </div>
      )}

      {/* Provision Account Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="Admin: Provision System Account"
      >
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Ali Hassan"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Account Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className={inputClass}
              >
                <option value="student">Student (Auto-Approved)</option>
                <option value="warden">Hostel Warden</option>
                <option value="driver">Transport Driver</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+92 300 1234567"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Initial Password *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
          </div>

          {/* Student specific fields */}
          {formData.role === 'student' && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Student Enrollment Details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Roll Number</label>
                  <input
                    type="text"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    placeholder="STU-2026-001"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Course / Program</label>
                  <input
                    type="text"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    placeholder="B.S Computer Science"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Room Number</label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="A-101"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Hostel Block</label>
                  <input
                    type="text"
                    value={formData.hostelBlock}
                    onChange={(e) => setFormData({ ...formData, hostelBlock: e.target.value })}
                    placeholder="Block A"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Parent Name</label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="Parent / Guardian Name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Parent Phone</label>
                  <input
                    type="tel"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    placeholder="+92 300 7654321"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Warden specific fields */}
          {formData.role === 'warden' && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Warden Assignment Details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Employee ID</label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="WRD-2001"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Assigned Hostel Block</label>
                  <input
                    type="text"
                    value={formData.hostelBlock}
                    onChange={(e) => setFormData({ ...formData, hostelBlock: e.target.value })}
                    placeholder="Block A"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Driver specific fields */}
          {formData.role === 'driver' && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Driver & Vehicle Details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>License Number</label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    placeholder="LIC-12345-PK"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Assigned Vehicle</label>
                  <input
                    type="text"
                    value={formData.assignedVehicle}
                    onChange={(e) => setFormData({ ...formData, assignedVehicle: e.target.value })}
                    placeholder="BUS-101"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Admin specific fields */}
          {formData.role === 'admin' && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Administrator Details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Employee ID</label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="ADM-001"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Campus Administration"
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="System Administrator"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
