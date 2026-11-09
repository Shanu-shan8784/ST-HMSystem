import React, { useState, useEffect } from 'react';
import { transportService } from '../../services/transportService';
import authService from '../../services/authService';
import Modal from '../../components/Modal';
import {
  Bus,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Phone,
  UserCheck,
  PlusCircle,
  Users,
  Search,
} from 'lucide-react';
import { getStatusBadgeStyle } from '../../utils/validators';

const RouteManager = () => {
  const [routes, setRoutes] = useState([]);
  const [students, setStudents] = useState([]);
  const [expandedRouteId, setExpandedRouteId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Map Student to Stop Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    studentId: '',
    routeId: '',
    stopName: '',
  });

  // Add Route Modal
  const [isAddRouteOpen, setIsAddRouteOpen] = useState(false);
  const [routeForm, setRouteForm] = useState({
    routeName: '',
    routeCode: '',
    driverName: '',
    driverPhone: '',
    vehicleNumber: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [routesRes, usersRes] = await Promise.allSettled([
        transportService.getRoutes(),
        authService.getAllUsers(),
      ]);

      if (routesRes.status === 'fulfilled' && routesRes.value.success) {
        setRoutes(routesRes.value.routes);
        if (routesRes.value.routes.length > 0 && !expandedRouteId) {
          setExpandedRouteId(routesRes.value.routes[0]._id);
        }
      }
      if (usersRes.status === 'fulfilled' && usersRes.value.success) {
        setStudents(usersRes.value.users.filter((u) => u.role === 'student'));
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await transportService.assignStudentStop(assignForm);
      if (res.success) {
        setIsAssignModalOpen(false);
        setAssignForm({ studentId: '', routeId: '', stopName: '' });
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    try {
      const res = await transportService.createRoute({
        ...routeForm,
        stops: [
          { stopName: 'Skardu Main Bazaar', morningTime: '07:30 AM', eveningTime: '05:30 PM', lat: 35.2971, lng: 75.6341 },
          { stopName: 'Baltistan University Gate', morningTime: '08:15 AM', eveningTime: '06:15 PM', lat: 35.2831, lng: 75.6541 },
        ],
      });
      if (res.success) {
        setIsAddRouteOpen(false);
        setRouteForm({ routeName: '', routeCode: '', driverName: '', driverPhone: '', vehicleNumber: '' });
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const selectedRouteForAssign = routes.find((r) => r._id === assignForm.routeId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Route & Stop Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Accordion schedules, assigned bus drivers, contact info, and student pickup/drop-off mapping.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md transition-all"
          >
            <UserCheck className="w-4 h-4" />
            <span>Map Student to Stop</span>
          </button>
          <button
            onClick={() => setIsAddRouteOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Route</span>
          </button>
        </div>
      </div>

      {/* Routes Accordion List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading route directory...</div>
        ) : (
          routes.map((route) => {
            const isExpanded = expandedRouteId === route._id;

            return (
              <div
                key={route._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => setExpandedRouteId(isExpanded ? null : route._id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {route.routeCode}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {route.routeName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                        <span>Vehicle: <strong className="text-slate-700 dark:text-slate-300">{route.vehicleNumber}</strong></span>
                        <span>Driver: <strong className="text-slate-700 dark:text-slate-300">{route.driverName}</strong></span>
                        <a
                          href={`tel:${route.driverPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono"
                        >
                          <Phone className="w-3 h-3" />
                          {route.driverPhone}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadgeStyle(
                        route.status
                      )}`}
                    >
                      {route.status}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {route.activeStudentsCount} commuters
                    </span>
                    <div className="p-1 rounded-lg text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Accordion Body: Stops Table */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Designated Stoppages & Arrival Timings ({route.stops?.length || 0} stops)
                      </h4>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="pb-2">Stop Order</th>
                            <th className="pb-2">Location / Waypoint</th>
                            <th className="pb-2">Morning Pickup</th>
                            <th className="pb-2">Evening Return</th>
                            <th className="pb-2">GPS Coordinates</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                          {(route.stops || []).map((stop, idx) => (
                            <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/30">
                              <td className="py-2.5 font-bold text-slate-500">#{idx + 1}</td>
                              <td className="py-2.5 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                {stop.stopName}
                              </td>
                              <td className="py-2.5 text-slate-600 dark:text-slate-300 font-medium">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-500" />
                                  {stop.morningTime}
                                </span>
                              </td>
                              <td className="py-2.5 text-slate-600 dark:text-slate-300 font-medium">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-indigo-500" />
                                  {stop.eveningTime}
                                </span>
                              </td>
                              <td className="py-2.5 text-slate-400 font-mono text-[11px]">
                                {stop.lat?.toFixed(4)}, {stop.lng?.toFixed(4)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Map Student to Stop Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Map Student to Pickup / Drop-off Stop"
      >
        <form onSubmit={handleAssignStudent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Student
            </label>
            <select
              required
              value={assignForm.studentId}
              onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="">-- Choose Student --</option>
              {students.map((stu) => (
                <option key={stu._id} value={stu._id}>
                  {stu.name} ({stu.rollNumber || stu.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Bus Route
            </label>
            <select
              required
              value={assignForm.routeId}
              onChange={(e) => setAssignForm({ ...assignForm, routeId: e.target.value, stopName: '' })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="">-- Choose Route --</option>
              {routes.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.routeCode} - {r.routeName}
                </option>
              ))}
            </select>
          </div>

          {selectedRouteForAssign && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Designated Bus Stop
              </label>
              <select
                required
                value={assignForm.stopName}
                onChange={(e) => setAssignForm({ ...assignForm, stopName: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="">-- Choose Stop --</option>
                {selectedRouteForAssign.stops?.map((s, idx) => (
                  <option key={idx} value={s.stopName}>
                    {s.stopName} (Morning: {s.morningTime})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!assignForm.studentId || !assignForm.routeId || !assignForm.stopName}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm disabled:opacity-50"
            >
              Save Mapping
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Route Modal */}
      <Modal isOpen={isAddRouteOpen} onClose={() => setIsAddRouteOpen(false)} title="Register New Bus Route">
        <form onSubmit={handleCreateRoute} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Route Code
              </label>
              <input
                type="text"
                required
                placeholder="R-104"
                value={routeForm.routeCode}
                onChange={(e) => setRouteForm({ ...routeForm, routeCode: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vehicle Plate
              </label>
              <input
                type="text"
                required
                placeholder="BUS-104"
                value={routeForm.vehicleNumber}
                onChange={(e) => setRouteForm({ ...routeForm, vehicleNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Route Name / Corridor
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Route 104 - East Airport Expressway"
              value={routeForm.routeName}
              onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Driver Name
              </label>
              <input
                type="text"
                required
                placeholder="Driver Name"
                value={routeForm.driverName}
                onChange={(e) => setRouteForm({ ...routeForm, driverName: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Driver Phone
              </label>
              <input
                type="tel"
                required
                placeholder="+91 98765 00000"
                value={routeForm.driverPhone}
                onChange={(e) => setRouteForm({ ...routeForm, driverPhone: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddRouteOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              Save Route
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RouteManager;

