import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  UserPlus,
  Search,
  Calendar,
  Clock,
  Car,
  Phone,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  Trash2,
  Eye,
  X,
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

const STATUS_ICONS = {
  'Pending': Clock,
  'Approved': CheckCircle,
  'Rejected': XCircle,
  'Checked-In': LogIn,
  'Checked-Out': LogOut,
};

export default function ResidentVisitors() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showRegister, setShowRegister] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [form, setForm] = useState({
    name: '', phone: '', vehicle_number: '', purpose: '',
    visit_date: new Date().toISOString().split('T')[0], expected_time: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchVisitors(); }, []);

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

  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/visitors', form);
      setShowRegister(false);
      setForm({ name: '', phone: '', vehicle_number: '', purpose: '', visit_date: new Date().toISOString().split('T')[0], expected_time: '' });
      fetchVisitors();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to register visitor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/visitors/${id}`);
      setDeleteConfirm(null);
      setSelectedVisitor(null);
      fetchVisitors();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  const filtered = visitors.filter((v) => {
    if (filter !== 'all' && v.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return v.name.toLowerCase().includes(s) || v.purpose.toLowerCase().includes(s) ||
        (v.vehicle_number || '').toLowerCase().includes(s) || (v.phone || '').includes(s);
    }
    return true;
  });

  const stats = {
    total: visitors.length,
    pending: visitors.filter(v => v.status === 'Pending').length,
    approved: visitors.filter(v => v.status === 'Approved').length,
    checkedIn: visitors.filter(v => v.status === 'Checked-In').length,
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-display-lg text-surface-900">My Visitors</h1>
            <p className="text-surface-500 mt-1">Register and track your visitors</p>
          </div>
          <button onClick={() => setShowRegister(true)} className="btn-brand">
            <UserPlus size={18} /> Register Visitor
          </button>
        </div>

        {/* Stats */}
        {loading ? <SkeletonList rows={2} /> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-hover p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                  <UserPlus size={20} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-500">Total</p>
                  <p className="text-xl font-bold text-surface-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="card-hover p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-500">Pending</p>
                  <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
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
                  <p className="text-xl font-bold text-success">{stats.approved}</p>
                </div>
              </div>
            </div>
            <div className="card-hover p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <LogIn size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-500">Checked In</p>
                  <p className="text-xl font-bold text-purple-600">{stats.checkedIn}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input type="text" placeholder="Search visitors..." value={search} onChange={e => setSearch(e.target.value)}
              className="input pl-10 w-full" />
          </div>
          <div className="flex items-center gap-1 bg-white border border-surface-100 rounded-xl p-1">
            {['all', 'Pending', 'Approved', 'Checked-In', 'Checked-Out'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === s ? 'bg-surface-900 text-white' : 'text-surface-500 hover:bg-surface-50'
                }`}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Visitors List */}
        {loading ? <SkeletonList rows={4} /> : filtered.length === 0 ? (
          <EmptyState icon={UserPlus} title="No visitors found"
            description={filter === 'all' ? "Register your first visitor to get started." : `No ${filter.toLowerCase()} visitors.`} />
        ) : (
          <div className="space-y-3">
            {filtered.map(visitor => {
              const StatusIcon = STATUS_ICONS[visitor.status] || Clock;
              return (
                <div key={visitor.id} className="card-hover p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      visitor.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                      visitor.status === 'Approved' ? 'bg-success-50 text-success' :
                      visitor.status === 'Rejected' ? 'bg-danger-100 text-danger' :
                      visitor.status === 'Checked-In' ? 'bg-purple-100 text-purple-600' :
                      'bg-surface-200 text-surface-500'
                    }`}>
                      <StatusIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-surface-900">{visitor.name}</h3>
                        <span className={STATUS_BADGES[visitor.status]}>{visitor.status}</span>
                      </div>
                      <p className="text-sm text-surface-500 mb-2">{visitor.purpose}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-surface-500">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(visitor.visit_date).toLocaleDateString()}</span>
                        {visitor.expected_time && <span className="flex items-center gap-1"><Clock size={12} /> {visitor.expected_time}</span>}
                        {visitor.phone && <span className="flex items-center gap-1"><Phone size={12} /> {visitor.phone}</span>}
                        {visitor.vehicle_number && <span className="flex items-center gap-1"><Car size={12} /> {visitor.vehicle_number}</span>}
                      </div>
                      {visitor.rejection_reason && visitor.status === 'Rejected' && (
                        <p className="text-xs text-danger mt-2">Reason: {visitor.rejection_reason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedVisitor(visitor)} className="btn-ghost btn-sm">
                        <Eye size={14} />
                      </button>
                      {visitor.status === 'Pending' && (
                        <button onClick={() => setDeleteConfirm(visitor.id)} className="btn-ghost btn-sm text-danger hover:bg-danger-50">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Register Modal */}
        {showRegister && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-surface-900/30 backdrop-blur-sm" onClick={() => setShowRegister(false)} />
            <div className="relative bg-white rounded-2xl shadow-elevated w-full max-w-md p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-display-sm text-surface-900">Register Visitor</h2>
                <button onClick={() => setShowRegister(false)} className="p-2 rounded-lg hover:bg-surface-100"><X size={18} /></button>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="label">Visitor Name *</label>
                  <input type="text" required className="input w-full" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Phone</label>
                    <input type="text" className="input w-full" value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
                  </div>
                  <div>
                    <label className="label">Vehicle Number</label>
                    <input type="text" className="input w-full" value={form.vehicle_number}
                      onChange={e => setForm({ ...form, vehicle_number: e.target.value })} placeholder="e.g. MH 12 AB 1234" />
                  </div>
                </div>
                <div>
                  <label className="label">Purpose *</label>
                  <input type="text" required className="input w-full" value={form.purpose}
                    onChange={e => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. Personal visit, Delivery" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Visit Date *</label>
                    <input type="date" required className="input w-full" value={form.visit_date}
                      onChange={e => setForm({ ...form, visit_date: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Expected Time</label>
                    <input type="time" className="input w-full" value={form.expected_time}
                      onChange={e => setForm({ ...form, expected_time: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowRegister(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-brand flex-1">
                    {submitting ? 'Registering...' : 'Register'}
                  </button>
                </div>
              </form>
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
                <div className="flex justify-between py-2 border-b border-surface-100">
                  <span className="text-sm text-surface-500">Name</span>
                  <span className="text-sm font-semibold text-surface-900">{selectedVisitor.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-surface-100">
                  <span className="text-sm text-surface-500">Status</span>
                  <span className={STATUS_BADGES[selectedVisitor.status]}>{selectedVisitor.status}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-surface-100">
                  <span className="text-sm text-surface-500">Purpose</span>
                  <span className="text-sm font-semibold text-surface-900">{selectedVisitor.purpose}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-surface-100">
                  <span className="text-sm text-surface-500">Visit Date</span>
                  <span className="text-sm font-semibold text-surface-900">{new Date(selectedVisitor.visit_date).toLocaleDateString()}</span>
                </div>
                {selectedVisitor.expected_time && (
                  <div className="flex justify-between py-2 border-b border-surface-100">
                    <span className="text-sm text-surface-500">Expected Time</span>
                    <span className="text-sm font-semibold text-surface-900">{selectedVisitor.expected_time}</span>
                  </div>
                )}
                {selectedVisitor.phone && (
                  <div className="flex justify-between py-2 border-b border-surface-100">
                    <span className="text-sm text-surface-500">Phone</span>
                    <span className="text-sm font-semibold text-surface-900">{selectedVisitor.phone}</span>
                  </div>
                )}
                {selectedVisitor.vehicle_number && (
                  <div className="flex justify-between py-2 border-b border-surface-100">
                    <span className="text-sm text-surface-500">Vehicle</span>
                    <span className="text-sm font-semibold text-surface-900">{selectedVisitor.vehicle_number}</span>
                  </div>
                )}
                {selectedVisitor.approved_by_name && (
                  <div className="flex justify-between py-2 border-b border-surface-100">
                    <span className="text-sm text-surface-500">Approved By</span>
                    <span className="text-sm font-semibold text-surface-900">{selectedVisitor.approved_by_name}</span>
                  </div>
                )}
                {selectedVisitor.rejection_reason && (
                  <div className="flex justify-between py-2 border-b border-surface-100">
                    <span className="text-sm text-surface-500">Rejection Reason</span>
                    <span className="text-sm font-semibold text-danger">{selectedVisitor.rejection_reason}</span>
                  </div>
                )}
                {selectedVisitor.checked_in_at && (
                  <div className="flex justify-between py-2 border-b border-surface-100">
                    <span className="text-sm text-surface-500">Checked In</span>
                    <span className="text-sm font-semibold text-purple-600">{new Date(selectedVisitor.checked_in_at).toLocaleString()}</span>
                  </div>
                )}
                {selectedVisitor.checked_out_at && (
                  <div className="flex justify-between py-2 border-b border-surface-100">
                    <span className="text-sm text-surface-500">Checked Out</span>
                    <span className="text-sm font-semibold text-surface-900">{new Date(selectedVisitor.checked_out_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
              {selectedVisitor.status === 'Pending' && (
                <div className="mt-4 pt-4 border-t border-surface-200">
                  <button onClick={() => { setDeleteConfirm(selectedVisitor.id); setSelectedVisitor(null); }}
                    className="btn-danger w-full">
                    <Trash2 size={16} /> Delete Visitor
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-surface-900/30 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
            <div className="relative bg-white rounded-2xl shadow-elevated w-full max-w-sm p-6 text-center animate-slide-up">
              <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={22} className="text-danger" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 mb-2">Delete Visitor?</h3>
              <p className="text-sm text-surface-500 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger flex-1">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
