import React, { useState, useEffect, useCallback } from 'react';
import { hostelService } from '../../services/hostelService';
import { BedDouble, FileText, AlertCircle, CheckCircle2, UserCheck, ArrowRight, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import EnrollStudentModal from '../../components/EnrollStudentModal';

const WardenDashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [roomsRes, leavesRes, complaintsRes] = await Promise.allSettled([
        hostelService.getRooms(),
        hostelService.getLeaveRequests(),
        hostelService.getComplaints(),
      ]);

      if (roomsRes.status === 'fulfilled' && roomsRes.value.success) {
        setRooms(roomsRes.value.rooms);
      }
      if (leavesRes.status === 'fulfilled' && leavesRes.value.success) {
        setLeaveRequests(leavesRes.value.outpasses);
      }
      if (complaintsRes.status === 'fulfilled' && complaintsRes.value.success) {
        setComplaints(complaintsRes.value.complaints);
      }
    } catch (err) {
      console.error('Error fetching warden dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pendingLeaves = leaveRequests.filter((l) => l.status === 'Pending');
  const openComplaints = complaints.filter((c) => c.status !== 'Resolved');
  const availableRoomsCount = rooms.filter((r) => r.status === 'available').length;
  const occupiedRoomsCount = rooms.filter((r) => r.status === 'occupied').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Hostel Warden Administration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor room occupancy matrix, authorize student outpass permits, and resolve hostel maintenance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enroll New Student</span>
          </button>
          <Link
            to="/warden/rooms"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <BedDouble className="w-4 h-4" />
            <span>Room Matrix & Allocation</span>
          </Link>
        </div>
      </div>

      {/* Action Success Alert */}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Available Rooms</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <BedDouble className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {loading ? '...' : availableRoomsCount}
            </span>
            <div className="text-xs text-slate-400 mt-1">Ready for immediate allocation</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Occupied Rooms</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {loading ? '...' : occupiedRoomsCount}
            </span>
            <div className="text-xs text-slate-400 mt-1">Full bed capacity reached</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Pending Outpasses</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
              {loading ? '...' : pendingLeaves.length}
            </span>
            <div className="text-xs text-slate-400 mt-1">Awaiting warden authorization</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Open Complaints</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-purple-600 dark:text-purple-400">
              {loading ? '...' : openComplaints.length}
            </span>
            <div className="text-xs text-slate-400 mt-1">Plumbing, Wi-Fi & repairs</div>
          </div>
        </div>
      </div>

      {/* Action Row: Quick Outpass Review & Open Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Outpasses quick list */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Pending Student Outpasses
              </h2>
              <p className="text-xs text-slate-400">Recent leave applications requiring permit</p>
            </div>
            <Link
              to="/warden/leave-requests"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View All ({pendingLeaves.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {pendingLeaves.length > 0 ? (
              pendingLeaves.slice(0, 3).map((l) => (
                <div
                  key={l._id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">
                      {l.studentName} <span className="text-xs text-slate-400 font-normal">({l.roomNumber})</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Destination: <span className="font-medium text-slate-700 dark:text-slate-300">{l.destination}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Reason: {l.reason}
                    </div>
                  </div>
                  <Link
                    to="/warden/leave-requests"
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0"
                  >
                    Review
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                All pending outpasses have been reviewed!
              </div>
            )}
          </div>
        </div>

        {/* Complaints quick list */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Urgent Hostel Complaints
              </h2>
              <p className="text-xs text-slate-400">Reported issues affecting student quarters</p>
            </div>
            <Link
              to="/warden/complaints"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Complaint Board <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {openComplaints.length > 0 ? (
              openComplaints.slice(0, 3).map((c) => (
                <div
                  key={c._id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        {c.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                        {c.category}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Room {c.roomNumber} &bull; Filed by {c.studentName}
                    </div>
                  </div>
                  <Link
                    to="/warden/complaints"
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white text-xs font-semibold shrink-0"
                  >
                    Update
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No pending maintenance complaints!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warden Enroll Student Modal */}
      <EnrollStudentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onSuccess={(newStudent) => {
          setActionSuccess(`Student ${newStudent.name} (${newStudent.rollNumber || 'Enrolled'}) successfully created and authorized!`);
          setTimeout(() => setActionSuccess(''), 5000);
          fetchData();
        }}
      />
    </div>
  );
};

export default WardenDashboard;

