export const STATUS_COLORS = {
  Open: 'bg-blue-100 text-blue-700',
  Assigned: 'bg-indigo-100 text-indigo-700',
  'Work Started': 'bg-cyan-100 text-cyan-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  Resolved: 'bg-emerald-100 text-emerald-700',
  Confirmed: 'bg-green-100 text-green-700',
  Reopened: 'bg-red-100 text-red-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-red-100 text-red-700',
  'Checked-In': 'bg-blue-100 text-blue-700',
  'Checked-Out': 'bg-surface-100 text-surface-600',
  Paid: 'bg-emerald-100 text-emerald-700',
  Unpaid: 'bg-red-100 text-red-700',
  Overdue: 'bg-orange-100 text-orange-700',
  Cancelled: 'bg-surface-100 text-surface-500',
  Active: 'bg-emerald-100 text-emerald-700',
  Inactive: 'bg-surface-100 text-surface-500',
};

export const PRIORITY_COLORS = {
  Low: 'bg-blue-100 text-blue-700',
  Medium: 'bg-amber-100 text-amber-700',
  High: 'bg-red-100 text-red-700',
  Urgent: 'bg-red-200 text-red-800',
};

export const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-700',
  resident: 'bg-blue-100 text-blue-700',
  security: 'bg-emerald-100 text-emerald-700',
  supervisor: 'bg-amber-100 text-amber-700',
  plumber: 'bg-cyan-100 text-cyan-700',
  electrician: 'bg-yellow-100 text-yellow-700',
  cleaner: 'bg-surface-100 text-surface-600',
};

export function getStatusBadge(status) {
  const color = STATUS_COLORS[status] || 'bg-surface-100 text-surface-600';
  return `<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}">${status}</span>`;
}

export function getStatusBadgeClass(status) {
  return STATUS_COLORS[status] || 'bg-surface-100 text-surface-600';
}

export function getPriorityBadgeClass(priority) {
  return PRIORITY_COLORS[priority] || 'bg-surface-100 text-surface-600';
}

export function getRoleBadgeClass(role) {
  return ROLE_COLORS[role] || 'bg-surface-100 text-surface-600';
}
