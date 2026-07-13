import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  AlertCircle,
  Clock,
  CheckCircle,
  Plus,
  ArrowRight,
  AlertTriangle,
  UserPlus,
  Play,
  ShieldCheck,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import { SkeletonCard, SkeletonList } from '../components/Skeletons';

const STATUS_ICONS = {
  'Open': { icon: AlertCircle, color: 'text-blue-500' },
  'Assigned': { icon: UserPlus, color: 'text-purple-500' },
  'Work Started': { icon: Play, color: 'text-indigo-500' },
  'In Progress': { icon: Clock, color: 'text-amber-500' },
  'Resolved': { icon: CheckCircle, color: 'text-emerald-500' },
  'Confirmed': { icon: ShieldCheck, color: 'text-green-600' },
  'Reopened': { icon: RotateCcw, color: 'text-red-500' },
};

const STATUS_BADGES = {
  'Open': 'badge-blue',
  'Assigned': 'badge-purple',
  'Work Started': 'badge-indigo',
  'In Progress': 'badge-amber',
  'Resolved': 'badge-green',
  'Confirmed': 'badge-green',
  'Reopened': 'badge-red',
};

const POLL_INTERVAL = 10000; // 10 seconds

export default function ResidentDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [polling, setPolling] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchComplaints();
    // Start polling
    intervalRef.current = setInterval(fetchComplaints, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/api/complaints');
      setComplaints(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const statusCounts = {
    total: complaints.length,
    open: complaints.filter((c) => c.status === 'Open').length,
    assigned: complaints.filter((c) => ['Assigned', 'Work Started', 'In Progress'].includes(c.status)).length,
    resolved: complaints.filter((c) => c.status === 'Resolved').length,
    confirmed: complaints.filter((c) => c.status === 'Confirmed').length,
  };

  const filterTabs = [
    { key: 'all', label: 'All', count: statusCounts.total },
    { key: 'Open', label: 'Open', count: statusCounts.open },
    { key: 'In Progress', label: 'Active', count: statusCounts.assigned },
    { key: 'Resolved', label: 'Resolved', count: statusCounts.resolved },
    { key: 'Confirmed', label: 'Confirmed', count: statusCounts.confirmed },
  ];

  const togglePolling = () => {
    if (polling) {
      clearInterval(intervalRef.current);
    } else {
      intervalRef.current = setInterval(fetchComplaints, POLL_INTERVAL);
    }
    setPolling(!polling);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-display-lg text-surface-900">My Complaints</h1>
            <p className="text-surface-500 mt-1">Track and manage your maintenance requests</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={togglePolling}
              className={`btn-ghost btn-sm ${polling ? 'text-success' : 'text-surface-400'}`}
              title={polling ? 'Live updates ON' : 'Live updates OFF'}
            >
              <RefreshCw size={14} className={polling ? 'animate-spin' : ''} style={polling ? { animationDuration: '3s' } : {}} />
              <span className="hidden sm:inline">{polling ? 'Live' : 'Paused'}</span>
            </button>
            <Link to="/raise-complaint" className="btn-brand">
              <Plus size={18} />
              Raise Complaint
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-hover p-4">
              <p className="text-xs font-medium text-surface-500">Total</p>
              <p className="text-2xl font-bold text-surface-900 mt-1">{statusCounts.total}</p>
            </div>
            <div className="card-hover p-4">
              <p className="text-xs font-medium text-surface-500">Open</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{statusCounts.open}</p>
            </div>
            <div className="card-hover p-4">
              <p className="text-xs font-medium text-surface-500">In Progress</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{statusCounts.assigned}</p>
            </div>
            <div className="card-hover p-4">
              <p className="text-xs font-medium text-surface-500">Confirmed</p>
              <p className="text-2xl font-bold text-success mt-1">{statusCounts.confirmed + statusCounts.resolved}</p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-white border border-surface-100 rounded-xl p-1 w-fit">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                filter === tab.key
                  ? 'bg-surface-900 text-white shadow-sm'
                  : 'text-surface-500 hover:text-surface-700 hover:bg-surface-50'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${filter === tab.key ? 'text-white/70' : 'text-surface-400'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Complaints List */}
        {loading ? (
          <SkeletonList rows={4} />
        ) : filteredComplaints.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="No complaints found"
            description={
              filter === 'all'
                ? "You haven't raised any complaints yet."
                : `No ${filter.toLowerCase()} complaints found.`
            }
            actionLabel="Raise Your First Complaint"
            actionTo="/raise-complaint"
          />
        ) : (
          <div className="space-y-3">
            {filteredComplaints.map((complaint) => {
              const statusCfg = STATUS_ICONS[complaint.status] || STATUS_ICONS['Open'];
              const StatusIcon = statusCfg.icon;
              return (
                <Link
                  key={complaint.id}
                  to={`/complaint/${complaint.id}`}
                  className="card-hover p-5 block"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusIcon size={18} className={statusCfg.color} />
                        <h3 className="font-semibold text-surface-900 truncate">{complaint.title}</h3>
                        {complaint.status === 'Reopened' && (
                          <span className="badge-red text-[10px]">REOPENED</span>
                        )}
                      </div>
                      <p className="text-sm text-surface-500 line-clamp-1 mb-3">{complaint.description}</p>

                      {/* Progress Bar */}
                      {complaint.status !== 'Confirmed' && (
                        <div className="mb-3">
                          <div className="w-full bg-surface-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-brand-400 transition-all duration-500"
                              style={{ width: `${getProgressPercent(complaint.status)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        <span className={STATUS_BADGES[complaint.status] || 'badge-surface'}>{complaint.status}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          complaint.priority === 'High' ? 'bg-red-100 text-red-600' :
                          complaint.priority === 'Medium' ? 'bg-amber-100 text-amber-600' :
                          'bg-surface-100 text-surface-500'
                        }`}>{complaint.priority}</span>
                        <span className="badge-surface">{complaint.category}</span>
                        {complaint.staff_name && (
                          <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <UserPlus size={10} /> {complaint.staff_name}
                          </span>
                        )}
                        {complaint.is_overdue ? (
                          <span className="badge-red">
                            <AlertTriangle size={10} className="mr-0.5" />
                            Overdue
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1 flex-shrink-0">
                      <span className="text-xs text-surface-400">
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </span>
                      <ArrowRight size={16} className="text-surface-300 sm:hidden" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Live status indicator */}
        {lastUpdated && (
          <p className="text-xs text-surface-400 text-center">
            Last updated: {lastUpdated.toLocaleTimeString()} {polling && `· Auto-refreshes every ${POLL_INTERVAL / 1000}s`}
          </p>
        )}
      </div>
    </Layout>
  );
}

function getProgressPercent(status) {
  const map = { 'Open': 10, 'Assigned': 25, 'Work Started': 40, 'In Progress': 60, 'Resolved': 85, 'Confirmed': 100, 'Reopened': 30 };
  return map[status] || 0;
}
