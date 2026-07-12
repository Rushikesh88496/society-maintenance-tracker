import React from 'react';

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-8 w-16" />
        </div>
        <div className="skeleton h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-surface-100">
        <div className="skeleton h-5 w-32" />
      </div>
      <div className="divide-y divide-surface-50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 flex items-center gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className={`skeleton h-4 ${
                  j === 0 ? 'w-48' : j === 1 ? 'w-24' : j === 2 ? 'w-20' : 'w-16'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card p-5">
          <div className="flex items-start gap-4">
            <div className="skeleton h-5 w-5 rounded flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-full" />
              <div className="flex gap-2">
                <div className="skeleton h-5 w-16 rounded-full" />
                <div className="skeleton h-5 w-12 rounded-full" />
                <div className="skeleton h-5 w-20 rounded-full" />
              </div>
            </div>
            <div className="skeleton h-4 w-20 flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-start gap-4 mb-6 pb-6 border-b border-surface-100">
          <div className="skeleton h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="skeleton h-6 w-64" />
            <div className="skeleton h-4 w-24" />
          </div>
          <div className="flex gap-2">
            <div className="skeleton h-6 w-20 rounded-full" />
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1"><div className="skeleton h-3 w-16" /><div className="skeleton h-5 w-32" /></div>
          <div className="space-y-1"><div className="skeleton h-3 w-16" /><div className="skeleton h-5 w-24" /></div>
          <div className="space-y-1"><div className="skeleton h-3 w-16" /><div className="skeleton h-5 w-36" /></div>
          <div className="space-y-1"><div className="skeleton h-3 w-16" /><div className="skeleton h-5 w-28" /></div>
        </div>
      </div>
      <div className="card p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="skeleton h-10 w-10 rounded-full flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="skeleton h-4 w-48" />
              <div className="skeleton h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
