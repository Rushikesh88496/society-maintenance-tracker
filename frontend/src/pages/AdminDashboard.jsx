import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  AlertCircle,
  Clock,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  UserPlus,
  Timer,
  CheckSquare,
  Users,
} from 'lucide-react';
import Layout from '../components/Layout';
import { SkeletonCard } from '../components/Skeletons';

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get('/api/dashboard');
      setDashboard(res.data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Complaints',
      value: dashboard?.total || 0,
      icon: TrendingUp,
      color: 'text-brand-600',
      iconBg: 'bg-brand-100',
    },
    {
      label: 'Open',
      value: dashboard?.byStatus?.find((s) => s.status === 'Open')?.count || 0,
      icon: AlertCircle,
      color: 'text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      label: 'In Progress',
      value: (dashboard?.byStatus?.find((s) => s.status === 'In Progress')?.count || 0) +
             (dashboard?.byStatus?.find((s) => s.status === 'Assigned')?.count || 0) +
             (dashboard?.byStatus?.find((s) => s.status === 'Work Started')?.count || 0),
      icon: Clock,
      color: 'text-amber-600',
      iconBg: 'bg-amber-100',
    },
    {
      label: 'Resolved',
      value: (dashboard?.byStatus?.find((s) => s.status === 'Resolved')?.count || 0) +
             (dashboard?.byStatus?.find((s) => s.status === 'Confirmed')?.count || 0),
      icon: CheckCircle,
      color: 'text-success-600',
      iconBg: 'bg-success-50',
    },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open': return 'badge-blue';
      case 'Assigned': return 'badge-purple';
      case 'Work Started': return 'badge-indigo';
      case 'In Progress': return 'badge-amber';
      case 'Resolved': return 'badge-green';
      case 'Confirmed': return 'badge-green';
      case 'Reopened': return 'badge-red';
      default: return 'badge-surface';
    }
  };

  const getPercent = (count) => {
    if (!dashboard?.total) return 0;
    return Math.round((count / dashboard.total) * 100);
  };

  const progress = dashboard?.progress || {};

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-display-lg text-surface-900">Dashboard</h1>
          <p className="text-surface-500 mt-1">Overview of society maintenance operations</p>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="card-hover p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-surface-500">{card.label}</p>
                      <p className={`text-3xl font-bold mt-2 ${card.color}`}>{card.value}</p>
                    </div>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                      <Icon size={22} className={card.color} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Progress Metrics */}
        {!loading && progress.assigned !== undefined && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <UserPlus size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-surface-500">Assigned</p>
                <p className="text-xl font-bold text-purple-600">{progress.assigned}</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-surface-500">Unassigned (Open)</p>
                <p className="text-xl font-bold text-orange-600">{progress.unassignedOpen}</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Timer size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-surface-500">Avg. Resolution</p>
                <p className="text-xl font-bold text-blue-600">{progress.avgResolutionDays || 0}d</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center flex-shrink-0">
                <CheckSquare size={20} className="text-success" />
              </div>
              <div>
                <p className="text-xs font-medium text-surface-500">Resolved Today</p>
                <p className="text-xl font-bold text-success">{progress.todayResolved}</p>
              </div>
            </div>
          </div>
        )}

        {/* Overdue Alert */}
        {dashboard?.overdue > 0 && (
          <div className="p-4 bg-danger-50 border border-danger-100 rounded-xl flex items-start gap-4 animate-slide-up">
            <div className="w-10 h-10 bg-danger-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-danger" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-danger-700">Overdue Complaints</h3>
              <p className="text-sm text-danger mt-0.5">
                {dashboard.overdue} complaint{dashboard.overdue !== 1 ? 's' : ''} exceed the resolution threshold.
              </p>
            </div>
            <Link to="/complaints?sort=overdue" className="btn-sm bg-danger text-white hover:bg-danger-600 flex-shrink-0">
              View All
            </Link>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Distribution */}
          <div className="lg:col-span-2 card p-6">
            <h2 className="text-display-sm text-surface-900 mb-6">Status Distribution</h2>
            <div className="space-y-5">
              {dashboard?.byStatus?.map((item) => {
                const pct = getPercent(item.count);
                const barColors = {
                  Open: 'bg-blue-500',
                  Assigned: 'bg-purple-500',
                  'Work Started': 'bg-indigo-500',
                  'In Progress': 'bg-amber-500',
                  Resolved: 'bg-emerald-500',
                  Confirmed: 'bg-green-500',
                  Reopened: 'bg-red-500',
                };
                const textColors = {
                  Open: 'text-blue-600',
                  Assigned: 'text-purple-600',
                  'Work Started': 'text-indigo-600',
                  'In Progress': 'text-amber-600',
                  Resolved: 'text-emerald-600',
                  Confirmed: 'text-green-600',
                  Reopened: 'text-red-600',
                };
                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${barColors[item.status] || 'bg-surface-300'}`} />
                        <span className="text-sm font-medium text-surface-700">{item.status}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${textColors[item.status] || 'text-surface-500'}`}>{item.count}</span>
                        <span className="text-xs text-surface-400 w-10 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-surface-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${barColors[item.status] || 'bg-surface-300'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Staff Workload */}
          <div className="card p-6">
            <h2 className="text-display-sm text-surface-900 mb-6">Staff Workload</h2>
            <div className="space-y-3">
              {dashboard?.staffWorkload?.length > 0 ? (
                dashboard.staffWorkload.map((sw) => (
                  <div key={sw.name} className="p-3 rounded-lg hover:bg-surface-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-surface-100 flex items-center justify-center text-[10px] font-bold text-surface-500">
                          {sw.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-surface-700">{sw.name}</p>
                          <p className="text-[10px] text-surface-400">{sw.role}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-amber-600 font-medium">{sw.active_count} active</span>
                      <span className="text-success font-medium">{sw.completed_count} done</span>
                    </div>
                    {(sw.active_count + sw.completed_count) > 0 && (
                      <div className="mt-2 w-full bg-surface-100 rounded-full h-1">
                        <div
                          className="h-1 rounded-full bg-brand-400 transition-all"
                          style={{ width: `${Math.round((sw.completed_count / (sw.active_count + sw.completed_count)) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Users size={24} className="mx-auto text-surface-300 mb-2" />
                  <p className="text-sm text-surface-400">No staff members yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Categories */}
        {!loading && dashboard?.byCategory?.length > 0 && (
          <div className="card p-6">
            <h2 className="text-display-sm text-surface-900 mb-6">Top Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {dashboard.byCategory
                .sort((a, b) => b.count - a.count)
                .slice(0, 8)
                .map((cat, i) => (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-50 hover:bg-surface-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-[10px] font-bold text-surface-500 shadow-sm">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-surface-700">{cat.category}</span>
                    </div>
                    <span className="text-sm font-bold text-surface-900">{cat.count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recent Complaints */}
        {dashboard?.recent?.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between p-6 pb-0">
              <h2 className="text-display-sm text-surface-900">Recent Complaints</h2>
              <Link to="/complaints" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="mt-4 table-wrapper rounded-t-none border-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>Complaint</th>
                    <th className="hidden sm:table-cell">Category</th>
                    <th>Status</th>
                    <th className="hidden md:table-cell">Assigned To</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recent.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link to={`/complaint/${c.id}`} className="font-medium text-surface-900 hover:text-brand-600 transition-colors">
                          {c.title}
                        </Link>
                        <p className="text-xs text-surface-400 mt-0.5">#{c.id.slice(0, 8)}</p>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="badge-surface">{c.category}</span>
                      </td>
                      <td>
                        <span className={getStatusBadge(c.status)}>{c.status}</span>
                      </td>
                      <td className="hidden md:table-cell">
                        {c.staff_name ? (
                          <span className="text-xs font-medium text-purple-600">{c.staff_name}</span>
                        ) : (
                          <span className="text-xs text-surface-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="text-surface-500 text-xs whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
