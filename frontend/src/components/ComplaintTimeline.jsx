import React from 'react';
import {
  AlertCircle,
  Clock,
  CheckCircle,
  UserPlus,
  UserMinus,
  Wrench,
  Play,
  RotateCcw,
  ShieldCheck,
  Flag,
} from 'lucide-react';

const ACTION_CONFIG = {
  created: { icon: AlertCircle, color: 'bg-blue-100 text-blue-600', label: 'Complaint Created' },
  assigned: { icon: UserPlus, color: 'bg-purple-100 text-purple-600', label: 'Staff Assigned' },
  unassigned: { icon: UserMinus, color: 'bg-surface-100 text-surface-500', label: 'Staff Unassigned' },
  work_started: { icon: Play, color: 'bg-indigo-100 text-indigo-600', label: 'Work Started' },
  work_in_progress: { icon: Wrench, color: 'bg-amber-100 text-amber-600', label: 'Work In Progress' },
  status_change: { icon: Clock, color: 'bg-amber-100 text-amber-600', label: 'Status Updated' },
  resolved: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600', label: 'Marked Resolved' },
  confirmed: { icon: ShieldCheck, color: 'bg-green-100 text-green-600', label: 'Resident Confirmed' },
  reopened: { icon: RotateCcw, color: 'bg-red-100 text-red-600', label: 'Complaint Reopened' },
  priority_change: { icon: Flag, color: 'bg-orange-100 text-orange-600', label: 'Priority Changed' },
};

function getActionConfig(entry) {
  if (entry.action && ACTION_CONFIG[entry.action]) return ACTION_CONFIG[entry.action];
  if (entry.new_status === 'Confirmed') return ACTION_CONFIG.confirmed;
  if (entry.new_status === 'Reopened') return ACTION_CONFIG.reopened;
  if (entry.new_status === 'Resolved') return ACTION_CONFIG.resolved;
  if (entry.new_status === 'Work Started') return ACTION_CONFIG.work_started;
  if (entry.new_status === 'In Progress') return ACTION_CONFIG.work_in_progress;
  if (entry.new_status === 'Assigned') return ACTION_CONFIG.assigned;
  return ACTION_CONFIG.status_change;
}

function getActionDescription(entry) {
  const cfg = getActionConfig(entry);
  let desc = cfg.label;

  if (entry.action === 'assigned' && entry.assigned_staff_name) {
    desc = `Assigned to ${entry.assigned_staff_name}`;
  } else if (entry.action === 'unassigned') {
    desc = 'Staff unassigned';
  } else if (entry.new_status && !['Confirmed', 'Reopened'].includes(entry.new_status)) {
    desc = `Status changed to ${entry.new_status}`;
  }

  if (entry.old_priority && entry.new_priority && entry.old_priority !== entry.new_priority) {
    desc += ` · Priority ${entry.old_priority} → ${entry.new_priority}`;
  }

  return desc;
}

export default function ComplaintTimeline({ history = [] }) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-surface-400 text-center py-8">No activity recorded yet</p>
    );
  }

  return (
    <div className="space-y-0">
      {history.map((entry, index) => {
        const cfg = getActionConfig(entry);
        const Icon = cfg.icon;
        const isLatest = index === 0;

        return (
          <div key={entry.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                isLatest ? cfg.color : 'bg-surface-100 text-surface-400'
              }`}>
                <Icon size={16} />
              </div>
              {index < history.length - 1 && (
                <div className="w-px flex-1 bg-surface-200 min-h-[24px]" />
              )}
            </div>
            <div className="pb-6 flex-1 min-w-0">
              <p className={`text-sm font-semibold ${isLatest ? 'text-surface-900' : 'text-surface-600'}`}>
                {getActionDescription(entry)}
              </p>
              <p className="text-xs text-surface-500 mt-0.5">
                By <span className="font-medium text-surface-700">{entry.actor_name || 'System'}</span>
                {' '}&middot;{' '}
                {new Date(entry.timestamp).toLocaleString()}
              </p>
              {entry.note && (
                <div className="mt-2 p-3 bg-surface-50 rounded-lg border border-surface-100">
                  <p className="text-sm text-surface-600">{entry.note}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
