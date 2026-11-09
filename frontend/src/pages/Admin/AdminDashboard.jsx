import React, { useState, useEffect } from 'react';
import { hostelService } from '../../services/hostelService';
import { transportService } from '../../services/transportService';
import authService from '../../services/authService';
import {
  Users,
  BedDouble,
  Bus,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/validators';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    maintenanceRooms: 0,
    occupancyRate: 0,
    totalCapacity: 0,
    occupiedBeds: 0,
    totalRoutes: 0,
    activeBuses: 0,
    pendingComplaints: 0,
    totalFeesCollected: 0,
    pendingFeesAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [roomsRes, routesRes, usersRes, complaintsRes, feesRes] = await Promise.allSettled([
          hostelService.getRooms(),
          transportService.getRoutes(),
          authService.getAllUsers(),
          hostelService.getComplaints(),
          transportService.getAllFees(),
        ]);

        const rooms = roomsRes.status === 'fulfilled' && roomsRes.value.success ? roomsRes.value.rooms : [];
        const routes = routesRes.status === 'fulfilled' && routesRes.value.success ? routesRes.value.routes : [];
        const users = usersRes.status === 'fulfilled' && usersRes.value.success ? usersRes.value.users : [];
        const complaints = complaintsRes.status === 'fulfilled' && complaintsRes.value.success ? complaintsRes.value.complaints : [];
        const fees = feesRes.status === 'fulfilled' && feesRes.value.success ? feesRes.value.fees : [];

        const totalCapacity = rooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
        const occupiedBeds = rooms.reduce((acc, r) => acc + (r.occupiedBeds || 0), 0);
        const occupancyRate = totalCapacity > 0 ? Math.round((occupiedBeds / totalCapacity) * 100) : 0;

        const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
        const availableRooms = rooms.filter((r) => r.status === 'available').length;
        const maintenanceRooms = rooms.filter((r) => r.status === 'maintenance').length;

        const pendingComplaints = complaints.filter((c) => c.status !== 'Resolved').length;

        const totalFeesCollected = fees
          .filter((f) => f.status === 'Paid')
          .reduce((sum, f) => sum + (f.amount || 0), 0);

        const pendingFeesAmount = fees
          .filter((f) => f.status !== 'Paid')
          .reduce((sum, f) => sum + (f.amount || 0), 0);

        setStats({
          totalUsers: users.length,
          totalRooms: rooms.length,
          occupiedRooms,
          availableRooms,
          maintenanceRooms,
          occupancyRate,
          totalCapacity,
          occupiedBeds,
          totalRoutes: routes.length,
          activeBuses: routes.filter((r) => r.status !== 'Idle').length,
          pendingComplaints,
          totalFeesCollected,
          pendingFeesAmount,
        });
      } catch (err) {
        console.error('Error fetching admin dashboard analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Institutional Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time analytics and management controls for hostel residency and campus transport.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/users"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Manage Users
          </Link>
          <Link
            to="/warden/rooms"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>Allocate Rooms</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Enrolled */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
              Total Enrolled
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {loading ? '...' : stats.totalUsers}
            </span>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> +12% from last term
            </div>
          </div>
        </div>

        {/* Card 2: Room Occupancy Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
              Hostel Occupancy
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <BedDouble className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {loading ? '...' : `${stats.occupancyRate}%`}
              </span>
              <span className="text-xs text-slate-400">
                ({stats.occupiedBeds} / {stats.totalCapacity} beds)
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.occupancyRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Active Bus Routes */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
              Active Bus Routes
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Bus className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {loading ? '...' : stats.activeBuses}
              </span>
              <span className="text-xs text-slate-400">
                of {stats.totalRoutes} registered lines
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold mt-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              Live GPS Syncing
            </div>
          </div>
        </div>

        {/* Card 4: Fee Revenue Collected */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
              Fee Collection
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {loading ? '...' : formatCurrency(stats.totalFeesCollected)}
            </span>
            <div className="text-xs text-rose-500 font-semibold mt-1">
              Pending dues: {formatCurrency(stats.pendingFeesAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Visual Room Breakdown + Transport Fleets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room Status Widget */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Hostel Rooms Matrix Breakdown
              </h2>
              <p className="text-xs text-slate-400">Current allocation across dormitory blocks</p>
            </div>
            <Link
              to="/warden/rooms"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Open Matrix Grid →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-center">
              <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.availableRooms}
              </span>
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Available Rooms
              </span>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-center">
              <span className="block text-2xl font-black text-rose-600 dark:text-rose-400">
                {stats.occupiedRooms}
              </span>
              <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                Full / Occupied
              </span>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-center">
              <span className="block text-2xl font-black text-amber-600 dark:text-amber-400">
                {stats.maintenanceRooms}
              </span>
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                Under Repair
              </span>
            </div>
          </div>

          {/* Block Occupancy bars */}
          <div className="space-y-3 pt-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                <span>Block A (North Wing - Boys)</span>
                <span>78% Occupancy</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '78%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                <span>Block B (South Wing - Girls)</span>
                <span>65% Occupancy</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: '65%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                <span>Block C (International Scholars)</span>
                <span>85% Occupancy</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Complaints and Operational Action Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Maintenance & Safety
              </h2>
              <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 mb-4">
              <span className="text-xs text-slate-400 uppercase font-semibold">
                Unresolved Student Issues
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats.pendingComplaints} Pending
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Plumbing, electrical & Wi-Fi issues awaiting warden resolution.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Mess kitchen health inspection verified</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>All 4 transport vehicles insured & fitness approved</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Weekly fire safety drill scheduled for Friday</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Link
              to="/warden/complaints"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
            >
              Review Complaints Queue
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
