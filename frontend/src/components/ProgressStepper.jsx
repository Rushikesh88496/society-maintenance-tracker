import React from 'react';
import {
  AlertCircle,
  UserPlus,
  Play,
  Wrench,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';

const STEPS = [
  { key: 'Open', label: 'Open', icon: AlertCircle },
  { key: 'Assigned', label: 'Assigned', icon: UserPlus },
  { key: 'Work Started', label: 'Work Started', icon: Play },
  { key: 'In Progress', label: 'In Progress', icon: Wrench },
  { key: 'Resolved', label: 'Resolved', icon: CheckCircle },
  { key: 'Confirmed', label: 'Confirmed', icon: ShieldCheck },
];

const STATUS_INDEX = {};
STEPS.forEach((s, i) => { STATUS_INDEX[s.key] = i; });

export default function ProgressStepper({ status }) {
  const currentIdx = STATUS_INDEX[status] ?? -1;
  const isReopened = status === 'Reopened';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isCompleted = i <= currentIdx && !isReopened;
          const isCurrent = i === currentIdx;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-1.5 relative">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCurrent
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 ring-4 ring-brand-100'
                    : isCompleted
                    ? 'bg-brand-100 text-brand-600'
                    : 'bg-surface-100 text-surface-400'
                }`}>
                  <Icon size={16} className={isCurrent ? 'text-white' : ''} />
                </div>
                <span className={`text-[10px] sm:text-xs font-medium text-center hidden sm:block ${
                  isCurrent ? 'text-brand-600' : isCompleted ? 'text-surface-700' : 'text-surface-400'
                }`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-1 sm:mx-2 mt-[-16px] sm:mt-0">
                  <div className={`h-0.5 sm:h-1 rounded-full transition-all duration-300 ${
                    i < currentIdx && !isReopened ? 'bg-brand-400' : 'bg-surface-200'
                  }`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      {isReopened && (
        <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-lg text-center">
          <p className="text-xs font-medium text-red-600">Complaint Reopened</p>
        </div>
      )}
    </div>
  );
}
