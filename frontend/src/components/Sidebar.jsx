import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  BedDouble,
  FileText,
  AlertCircle,
  Bus,
  MapPin,
  CreditCard,
  UtensilsCrossed,
  X,
  ShieldCheck,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, role } = useAuth();

  // Navigation items partitioned by user role
  const getNavLinks = () => {
    switch (role) {
      case 'admin':
        return [
          { name: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'User Management', path: '/admin/users', icon: Users },
          { name: 'Hostel Rooms Matrix', path: '/warden/rooms', icon: BedDouble },
          { name: 'Leave & Outpasses', path: '/warden/leave-requests', icon: FileText },
          { name: 'Maintenance Complaints', path: '/warden/complaints', icon: AlertCircle },
          { name: 'Route Directory', path: '/transport/routes', icon: Bus },
          { name: 'Live GPS Bus Tracking', path: '/transport/live', icon: MapPin },
          { name: 'Billing & Financials', path: '/student/fees', icon: CreditCard },
        ];
      case 'warden':
        return [
          { name: 'Warden Dashboard', path: '/warden/dashboard', icon: LayoutDashboard },
          { name: 'Room Matrix & Allocation', path: '/warden/rooms', icon: BedDouble },
          { name: 'Leave Requests & Outpass', path: '/warden/leave-requests', icon: FileText },
          { name: 'Hostel Complaints', path: '/warden/complaints', icon: AlertCircle },
          { name: 'Mess Schedule & Student', path: '/student/dashboard', icon: UtensilsCrossed },
        ];
      case 'driver':
        return [
          { name: 'Transport Dashboard', path: '/transport/dashboard', icon: LayoutDashboard },
          { name: 'Live Route Tracking', path: '/transport/live', icon: MapPin },
          { name: 'Route & Stop Manager', path: '/transport/routes', icon: Bus },
        ];
      case 'student':
      default:
        return [
          { name: 'Student Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
          { name: 'Leave / Outpass Form', path: '/student/outpass', icon: FileText },
          { name: 'Fee & Billing Status', path: '/student/fees', icon: CreditCard },
          { name: 'Live Bus Tracking', path: '/transport/live', icon: MapPin },
          { name: 'Hostel Complaints', path: '/warden/complaints', icon: AlertCircle },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:z-0 flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto px-4 py-5">
          {/* Mobile top close */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800 lg:hidden">
            <span className="font-bold text-slate-800 dark:text-white text-base">Navigation</span>
            <button
              onClick={onClose}
              aria-label="Close Navigation"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Role Tag */}
          <div className="mb-4 px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm uppercase">
              {role?.[0] || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-blue-950 dark:text-blue-200 truncate">
                {user?.name || 'Active User'}
              </span>
              <span className="text-[10px] uppercase font-semibold text-blue-600 dark:text-blue-400">
                {role} portal
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose?.()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <span>HostelX Transport v1.0</span>
          <span className="flex items-center gap-1 text-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

