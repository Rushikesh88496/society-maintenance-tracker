import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Search,
  Calendar,
  Car,
  Phone,
  CheckCircle,
  XCircle,
  Eye,
  Users,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/Skeletons';

const STATUS_BADGES = {
  'Pending': 'badge-amber',
  'Approved': 'badge-green',
  'Rejected': 'badge-red',
  'Checked-In': 'badge-purple',
  'Checked-Out': 'badge-surface',
};

export default function AdminVisitors() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [actionNote, setActionNote] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => { fetchVisitors(); fetchStats(); }, []);

  const fetchVisitors = async () => {
    try {
      const res = await api.get('/api/visitors');
      setVisitors(res.data);
    } catch (err) {
      console.error('Error fetching visitors:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/visitors/stats/summary');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async () => {
    try {
      await api.put(`/api/visitors/${actionModal.id}/approve`, { note: actionNote });
      setActionModal(null); setActionNote(''); fetchVisitors(); fetchStats();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handleReject = async () => {
    try {
      await api.put(`/api/visitors/${actionModal.id}/reject`, { reason: actionNote || 'Rejected by admin' });
      setActionModal(null); setActionNote(''); fetchVisitors(); fetchStats();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const filtered = visitors.filter((v) => {
    if (filter !== 'all' && v.status !== filter) return false;
    if (dateFilter && v.visit_date !== dateFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return v.name.toLowerCase().includes(s) || (v.resident_name || '').toLowerCase().includes(s) ||
        (v.apartment_number || '').toLowerCase().includes(s) || (v.vehicle_number || '').toLowerCase().includes(s) ||
        (v.phone || '').includes(s);
    }
    return true;
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-display-lg text-surface-900">Visitor Management</h1>
          <p className="text-surface-500 mt-1">Approve, reject, and track visitor entries</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-hover p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                  <Users size={20} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-500">Today's Visitors</p>
                  <p className="text-xl font-bold text-surface-900">{stats.todayVisitors?.count || 0}</p>
                </div>
              </div>
            </div>
            <div className="card-hover p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <AlertCircle size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-500">Pending Approval</p>
                  <p className="text-xl font-bold text-amber-600">{stats.pending?.count || 0}</p>
                </div>
              </div>
            </div>
            <div className="card-hover p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center">
                  <CheckCircle size={20} className="text-success" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-500">Approved</p>
                  <p className="text-xl font-bold text-success">{stats.approved?.count || 0}</p>
                </div>
              </div>
            </div>
            <div className="card-hover p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <UserCheck size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-500">Checked In</p>
                  <p className="text-xl font-bold text-purple-600">{stats.checkedIn?.count || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input type="text" placeholder="Search by name, resident, apartment, vehicle..." value={search}
              onChange={e => setSearch(e.target.value)} className="input pl-10 w-full" />
          </div>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="input w-auto" />
          <div className="flex items-center gap-1 bg-white border border-surface-100 rounded-xl p-1">
            {['all', 'Pending', 'Approved', 'Checked-In', 'Checked-Out', 'Rejected'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === s ? 'bg-surface-900 text-white' : 'text-surface-500 hover:bg-surface-50'
                }`}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? <SkeletonList rows={5} /> : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No visitors found" description="No visitor entries match your filters." />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Resident</th>
                    <th>Visit</th>
                    <th>Vehicle</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(v => (
                    <tr key={v.id}>
                      <td>
                        <div>
                          <p className="font-semibold text-surface-900">{v.name}</p>
                          {v.phone && <p className="text-xs text-surface-500 flex items-center gap-1"><Phone size={10} /> {v.phone}</p>}
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="text-sm text-surface-700">{v.resident_name || '---'}</p>
                          {v.apartment_number && <p className="text-xs text-surface-500">Apt: {v.apartment_number}</p>}
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="text-sm text-surface-700 flex items-center gap-1">
                            <Calendar size={12} /> {new Date(v.visit_date).toLocaleDateString()}
                          </p>
                          {v.expected_time && <p className="text-xs text-surface-500">{v.expected_time}</p>}
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-surface-700 flex items-center gap-1">
                          {v.vehicle_number ? <><Car size={12} /> {v.vehicle_number}</> : '---'}
                        </span>
                      </td>
                      <td><span className={STATUS_BADGES[v.status]}>{v.status}</span></td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setSelectedVisitor(v)} className="btn-ghost btn-sm"><Eye size={14} /></button>
                          {v.status === 'Pending' && (
                            <>
                              <button onClick={() => { setActionModal({ ...v, action: 'approve' }); setActionNote(''); }}
                                className="btn-ghost btn-sm text-success hover:bg-success-50"><CheckCircle size={14} /></button>
                              <button onClick={() => { setActionModal({ ...v, action: 'reject' }); setActionNote(''); }}
                                className="btn-ghost btn-sm text-danger hover:bg-danger-50"><XCircle size={14} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedVisitor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-surface-900/30 backdrop-blur-sm" onClick={() => setSelectedVisitor(null)} />
            <div className="relative bg-white rounded-2xl shadow-elevated w-full max-w-lg p-6 animate-slide-up max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-display-sm text-surface-900">Visitor Details</h2>
                <button onClick={() => setSelectedVisitor(null)} className="p-2 rounded-lg hover:bg-surface-100"><X size={18} /></button>
              </div>
              <div className="space-y-3">
                {[
                  ['Name', selectedVisitor.name],
                  ['Status', selectedVisitor.status, STATUS_BADGES[selectedVisitor.status]],
                  ['Purpose', selectedVisitor.purpose],
                  ['Visit Date', new Date(selectedVisitor.visit_date).toLocaleDateString()],
                  ['Expected Time', selectedVisitor.expected_time],
                  ['Phone', selectedVisitor.phone],
                  ['Vehicle', selectedVisitor.vehicle_number],
                  ['Resident', selectedVisitor.resident_name],
                  ['Apartment', selectedVisitor.apartment_number],
                  ['Approved By', selectedVisitor.approved_by_name],
                  ['Checked In At', selectedVisitor.checked_in_at ? new Date(selectedVisitor.checked_in_at).toLocaleString() : null],
                  ['Checked In By', selectedVisitor.checked_in_by_name],
                  ['Checked Out At', selectedVisitor.checked_out_at ? new Date(selectedVisitor.checked_out_at).toLocaleString() : null],
                  ['Checked Out By', selectedVisitor.checked_out_by_name],
                  ['Rejection Reason', selectedVisitor.rejection_reason],
                ].filter(([, val]) => val).map(([label, value, badge]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-surface-100">
                    <span className="text-sm text-surface-500">{label}</span>
                    {badge ? <span className={badge}>{value}</span> : <span className="text-sm font-semibold text-surface-900">{value}</span>}
                  </div>
                ))}
              </div>
              {selectedVisitor.status === 'Pending' && (
                <div className="flex gap-3 mt-6 pt-4 border-t border-surface-200">
                  <button onClick={() => { setActionModal({ ...selectedVisitor, action: 'reject' }); setSelectedVisitor(null); setActionNote(''); }}
                    className="btn-danger flex-1"><XCircle size={16} /> Reject</button>
                  <button onClick={() => { setActionModal({ ...selectedVisitor, action: 'approve' }); setSelectedVisitor(null); setActionNote(''); }}
                    className="btn-success flex-1"><CheckCircle size={16} /> Approve</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Approve/Reject Modal */}
        {actionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-surface-900/30 backdrop-blur-sm" onClick={() => setActionModal(null)} />
            <div className="relative bg-white rounded-2xl shadow-elevated w-full max-w-sm p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-display-sm text-surface-900">
                  {actionModal.action === 'approve' ? 'Approve' : 'Reject'} Visitor
                </h2>
                <button onClick={() => setActionModal(null)} className="p-2 rounded-lg hover:bg-surface-100"><X size={18} /></button>
              </div>
              <p className="text-sm text-surface-500 mb-4">
                {actionModal.action === 'approve'
                  ? `Approve visit by ${actionModal.name} on ${new Date(actionModal.visit_date).toLocaleDateString()}?`
                  : `Reject visit by ${actionModal.name}? Provide a reason below.`}
              </p>
              <div className="mb-4">
                <label className="label">{actionModal.action === 'approve' ? 'Note (optional)' : 'Rejection Reason *'}</label>
                <input type="text" className="input w-full" value={actionNote}
                  onChange={e => setActionNote(e.target.value)}
                  placeholder={actionModal.action === 'approve' ? 'Optional note' : 'Enter reason'} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setActionModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={actionModal.action === 'approve' ? handleApprove : handleReject}
                  className={actionModal.action === 'approve' ? 'btn-success flex-1' : 'btn-danger flex-1'}>
                  {actionModal.action === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
