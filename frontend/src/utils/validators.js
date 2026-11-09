import { z } from 'zod';

// Zod Schemas
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'warden', 'driver', 'admin']),
  phone: z.string().min(10, 'Please enter a valid contact number').optional().or(z.literal('')),
  rollNumber: z.string().optional().or(z.literal('')),
  hostelBlock: z.string().optional().or(z.literal('')),
});

export const outpassSchema = z.object({
  destination: z.string().min(3, 'Destination is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  leaveDate: z.string().min(1, 'Leave date and time are required'),
  returnDate: z.string().min(1, 'Return date and time are required'),
  emergencyContact: z.string().min(10, 'Valid emergency contact number is required'),
});

export const complaintSchema = z.object({
  category: z.enum(['Plumbing', 'Wi-Fi', 'Electrical', 'Carpentry', 'Cleaning', 'Other']),
  title: z.string().min(4, 'Title must be at least 4 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  roomNumber: z.string().min(1, 'Room number is required'),
});

// Formatters
export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// UI Badge Styling Helpers
export const getRoomStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case 'available':
      return {
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        cardBorder: 'border-emerald-500/50 hover:border-emerald-500',
        bgSubtle: 'bg-emerald-50/50 dark:bg-emerald-950/20',
        indicator: 'bg-emerald-500',
        label: 'Available',
      };
    case 'occupied':
      return {
        badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        cardBorder: 'border-rose-500/50 hover:border-rose-500',
        bgSubtle: 'bg-rose-50/50 dark:bg-rose-950/20',
        indicator: 'bg-rose-500',
        label: 'Occupied',
      };
    case 'maintenance':
    default:
      return {
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        cardBorder: 'border-amber-500/50 hover:border-amber-500',
        bgSubtle: 'bg-amber-50/50 dark:bg-amber-950/20',
        indicator: 'bg-amber-500',
        label: 'Maintenance',
      };
  }
};

export const getStatusBadgeStyle = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'paid':
    case 'resolved':
    case 'active':
    case 'on schedule':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
    case 'pending':
    case 'in progress':
    case 'delayed':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800';
    case 'rejected':
    case 'overdue':
    case 'high':
    case 'urgent':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-300 dark:border-rose-800';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700';
  }
};

