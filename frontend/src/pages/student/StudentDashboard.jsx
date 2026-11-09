import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { hostelService } from '../../services/hostelService';
import { transportService } from '../../services/transportService';
import {
  BedDouble,
  UtensilsCrossed,
  Bus,
  FileText,
  CreditCard,
  AlertCircle,
  Clock,
  Phone,
  Calendar,
  Sparkles,
  ArrowRight,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [messMenu, setMessMenu] = useState([]);
  const [activeDay, setActiveDay] = useState('Monday');
  const [roomDetails, setRoomDetails] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const [menuRes, roomsRes, routesRes, feesRes] = await Promise.allSettled([
          hostelService.getMessMenu(),
          hostelService.getRooms(),
          transportService.getRoutes(),
          transportService.getMyFees(),
        ]);

        if (menuRes.status === 'fulfilled' && menuRes.value.success) {
          setMessMenu(menuRes.value.messMenu || []);
          // Set current day of week
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const today = days[new Date().getDay()];
          setActiveDay(today);
        }

        if (roomsRes.status === 'fulfilled' && roomsRes.value.success) {
          const matched = roomsRes.value.rooms.find(
            (r) => r.roomNumber === user?.roomNumber || r.occupants?.some((o) => o.studentId === user?.id || o.name === user?.name)
          );
          setRoomDetails(matched || roomsRes.value.rooms[0]);
        }

        if (routesRes.status === 'fulfilled' && routesRes.value.success) {
          const matchedRoute = routesRes.value.routes.find(
            (r) => r._id === user?.busRouteId || r.routeCode === 'R-101'
          );
          setRouteDetails(matchedRoute || routesRes.value.routes[0]);
        }

        if (feesRes.status === 'fulfilled' && feesRes.value.success) {
          setFees(feesRes.value.fees || []);
        }
      } catch (err) {
        console.error('Error fetching student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user]);

  const currentDayMenu = messMenu.find((m) => m.day === activeDay) || messMenu[0];
  const pendingFees = fees.filter((f) => f.status !== 'Paid');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-blue-200">
            Student Residency Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
            Roll No: <span className="font-mono font-bold">{user?.rollNumber || 'STU-2024-88'}</span> &bull; Room:{' '}
            <span className="font-bold">{roomDetails?.roomNumber || user?.roomNumber || 'A-101'}</span> &bull; Assigned Bus:{' '}
            <span className="font-bold">{routeDetails?.routeCode || 'R-101'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Link
            to="/student/outpass"
            className="px-4 py-2.5 rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Apply Outpass</span>
          </Link>
          <Link
            to="/warden/complaints"
            className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur transition-all"
          >
            Report Issue
          </Link>
        </div>
      </div>

      {/* Top Cards: Room & Transport Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Room Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase text-slate-400">Hostel Accommodation</span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <BedDouble className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                Room {roomDetails?.roomNumber || 'A-101'}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                ({roomDetails?.block || 'Block A'})
              </span>
            </div>

            {/* Roommates */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Roommates & Occupancy ({roomDetails?.occupiedBeds || 2}/{roomDetails?.capacity || 2})
              </span>
              <div className="space-y-1.5">
                {(roomDetails?.occupants || []).map((occ, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      {occ.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Bed #{occ.bedNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Amenities: Wi-Fi, AC, Study</span>
          </div>
        </div>

        {/* Transport Stoppage Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase text-slate-400">Daily Bus Commute</span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <Bus className="w-5 h-5" />
              </div>
            </div>

            <div>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {routeDetails?.routeCode || 'R-101'}
              </span>
              <div className="text-xs text-slate-500 font-medium truncate mt-0.5">
                {routeDetails?.routeName || 'North City Expressway'}
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">My Stoppage:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {user?.busStop || routeDetails?.stops?.[0]?.stopName || 'Central Metro Hub'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pickup Timing:</span>
                <span className="font-semibold text-emerald-600">
                  {routeDetails?.stops?.[0]?.morningTime || '07:15 AM'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Driver Contact:</span>
                <a
                  href={`tel:${routeDetails?.driverPhone}`}
                  className="font-mono text-blue-600 dark:text-blue-400 font-semibold"
                >
                  {routeDetails?.driverPhone || '+91 98765 43212'}
                </a>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Link
              to="/transport/live"
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 transition-colors"
            >
              <span>Track Bus Live on Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Fees & Outpass status card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase text-slate-400">Financials & Permits</span>
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            <div>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {pendingFees.length > 0 ? `${pendingFees.length} Pending Due` : 'Fees Cleared'}
              </span>
              <div className="text-xs text-slate-400 mt-0.5">
                Hostel accommodation and mess dues
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                <span className="text-slate-600 dark:text-slate-300">Outpass Requests</span>
                <Link
                  to="/student/outpass"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View Tracker →
                </Link>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                <span className="text-slate-600 dark:text-slate-300">Billing Invoices</span>
                <Link
                  to="/student/fees"
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Pay Online →
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
            Payment deadline: 15th of each month
          </div>
        </div>
      </div>

      {/* Mess Menu Display */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Weekly Hostel Mess Menu Schedule
              </h2>
              <p className="text-xs text-slate-400">
                Nutritious multi-course dining: Breakfast, Lunch, High Tea Snacks & Dinner.
              </p>
            </div>
          </div>

          {/* Day selection tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
              (day) => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeDay === day
                      ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {day}
                </button>
              )
            )}
          </div>
        </div>

        {/* Selected Day's Meals Grid */}
        {currentDayMenu ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* Breakfast */}
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Breakfast
                  </span>
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                    07:30 - 09:30 AM
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  {currentDayMenu.breakfast}
                </p>
              </div>
            </div>

            {/* Lunch */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Lunch
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                    12:30 - 02:30 PM
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  {currentDayMenu.lunch}
                </p>
              </div>
            </div>

            {/* Snacks */}
            <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300">
                    Evening Snacks
                  </span>
                  <span className="text-[10px] font-semibold text-purple-600 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-md">
                    05:00 - 06:15 PM
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  {currentDayMenu.snacks}
                </p>
              </div>
            </div>

            {/* Dinner */}
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                    Dinner
                  </span>
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-md">
                    08:00 - 10:00 PM
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  {currentDayMenu.dinner}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">Loading mess menu...</div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;

