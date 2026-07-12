import React from 'react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  icon: Icon,
  title = 'No data found',
  description = 'There is nothing to show here yet.',
  actionLabel,
  actionTo,
  onAction,
}) {
  return (
    <div className="card p-12 text-center">
      {Icon && (
        <div className="w-16 h-16 mx-auto bg-surface-100 rounded-2xl flex items-center justify-center mb-5">
          <Icon size={28} className="text-surface-300" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-surface-900 mb-1">{title}</h3>
      <p className="text-sm text-surface-500 max-w-sm mx-auto mb-6">{description}</p>
      {actionLabel && (actionTo || onAction) && (
        <>
          {actionTo ? (
            <Link to={actionTo} className="btn-brand">
              {actionLabel}
            </Link>
          ) : (
            <button onClick={onAction} className="btn-brand">
              {actionLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}
