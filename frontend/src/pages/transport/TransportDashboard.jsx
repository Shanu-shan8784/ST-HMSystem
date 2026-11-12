import React, { useState, useEffect } from 'react';
import { transportService } from '../../services/transportService';
import { toast } from 'react-toastify';
import {
  Bus,
  MapPin,
  Users,
  AlertTriangle,
  Send,
  Phone,
  ShieldCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Table from '../../components/Table';
import { formatDate } from '../../utils/validators';

const TransportDashboard = () => {
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Broadcast Alert Form
  const [alertForm, setAlertForm] = useState({
    routeId: '',
    message: '',
    severity: 'info',
  });
  const [broadcastSuccess, setBroadcastSuccess] = useState('');

  const fetchTransportData = async () => {
    try {
      setLoading(true);
      const [routesRes, vehiclesRes] = await Promise.allSettled([
        transportService.getRoutes(),
        transportService.getVehicles(),
      ]);

      if (routesRes.status === 'fulfilled' && routesRes.value.success) {
        setRoutes(routesRes.value.routes);
      }
      if (vehiclesRes.status === 'fulfilled' && vehiclesRes.value.success) {
        setVehicles(vehiclesRes.value.vehicles);
      }
    } catch (err) {
      console.error('Error fetching transport dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransportData();
  }, []);

  const handleBroadcastAlert = async (e) => {
    e.preventDefault();
    if (!alertForm.message) return;
    try {
      const res = await transportService.sendAlert(alertForm);
      if (res.success) {
        setBroadcastSuccess('Alert successfully broadcasted to student & parent apps!');
        setAlertForm({ routeId: '', message: '', severity: 'info' });
        setTimeout(() => setBroadcastSuccess(''), 4000);
        fetchTransportData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const totalStudentsTransported = routes.reduce((sum, r) => sum + (r.activeStudentsCount || 0), 0);

  const vehicleColumns = [
    {
      header: 'Vehicle Number & Model',
      render: (v) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Bus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{v.vehicleNumber}</span>
          </div>
          <div className="text-xs text-slate-400">{v.model}</div>
        </div>
      ),
    },
    {
      header: 'Assigned Driver',
      render: (v) => <span className="font-medium text-xs text-slate-700 dark:text-slate-300">{v.assignedDriver}</span>,
    },
    {
      header: 'Capacity',
      render: (v) => <span className="text-xs text-slate-500">{v.capacity} Seats</span>,
    },
    {
      header: 'Insurance Expiry',
      render: (v) => (
        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          {formatDate(v.insuranceExpiry)}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (v) => (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            v.status === 'Active'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          }`}
        >
          {v.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Transport & Fleet Operations
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Bus route directories, real-time GPS fleet tracking, driver contact lists, and parent alert broadcasting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/transport/live"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <MapPin className="w-4 h-4" />
            <span>Open Live GPS Map</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Total Routes</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {loading ? '...' : routes.length}
            </span>
            <div className="text-xs text-slate-400 mt-1">Connecting 28 designated stops</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Active Fleet</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Bus className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {loading ? '...' : vehicles.filter((v) => v.status === 'Active').length}
            </span>
            <div className="text-xs text-slate-400 mt-1">Buses running daily transit</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Students Transported</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {loading ? '...' : totalStudentsTransported || 95}
            </span>
            <div className="text-xs text-slate-400 mt-1">Active daily commuters</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Schedule Reliability</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              96.4%
            </span>
            <div className="text-xs text-emerald-600 font-semibold mt-1">On-time arrival rate</div>
          </div>
        </div>
      </div>

      {/* Middle Row: Broadcast Alert to Parents & Quick Routes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Broadcast Alert Box */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Parent Broadcast Alert
              </h2>
              <p className="text-xs text-slate-400">Broadcast traffic, delays or emergency banners</p>
            </div>
          </div>

          {broadcastSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs">
              {broadcastSuccess}
            </div>
          )}

          <form onSubmit={handleBroadcastAlert} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Route
              </label>
              <select
                value={alertForm.routeId}
                onChange={(e) => setAlertForm({ ...alertForm, routeId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="">All Bus Routes (All Parents)</option>
                {routes.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.routeCode} - {r.routeName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Alert Severity
              </label>
              <select
                value={alertForm.severity}
                onChange={(e) => setAlertForm({ ...alertForm, severity: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="info">Info / General Arrival Update</option>
                <option value="warning">Warning / Heavy Traffic Delay</option>
                <option value="emergency">Emergency / Route Detour</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notification Message
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Bus 101 running ~10 mins late due to road construction at Tech Park."
                value={alertForm.message}
                onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Broadcast Alert</span>
            </button>
          </form>
        </div>

        {/* Vehicles Fleet Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Vehicle Fleet Directory
              </h2>
              <p className="text-xs text-slate-400">Assigned drivers and compliance credentials</p>
            </div>
            <Link
              to="/transport/routes"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Manage Routes & Stops <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Table columns={vehicleColumns} data={vehicles} searchable={false} />
        </div>
      </div>
    </div>
  );
};

export default TransportDashboard;

