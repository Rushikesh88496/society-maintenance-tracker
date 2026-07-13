import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Search,
  Calendar,
  Clock,
  Car,
  Phone,
  LogIn,
  LogOut,
  Eye,
  UserCheck,
  CheckCircle,
  X,
  Shield,
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

export default function SecurityVisitors() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/visitors/stats/summary');
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const handleCheckIn = async () => {
    try {
      await api.put(`/api/visitors/${actionModal.id}/checkin`, { note: actionNote || 'Checked in by security' });
      setActionModal(null); setActionNote(''); fetchVisitors(); fetchStats();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handleCheckOut = async () => {
    try {
      await api.put(`/api/visitors/${actionModal.id}/checkout`, { note: actionNote || 'Checked out by security' });
      setActionModal(null); setActionNote(''); fetchVisitors(); fetchStats();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const filtered = visitors.filter((v) => {
    if (filter !== 'all' && v.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return v.name.toLowerCase().includes(s) || (v.resident_name || '').toLowerCase().includes(s) ||
        (v.apartment_number || '').toLowerCase().includes(s) || (v.vehicle_number || '').toLowerCase().includes(s);
    }
    return true;
  });

  const todayCount = visitors.filter(v => {
    const today = new Date().toISOString().split('T')[0];
    return v.visit_date === today && (v.status === 'Checked-In' || v.status === 'Checked-Out');
  }).length;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-display-lg text-surface-900">Security Desk</h1>
          <p className="text-surface-500 mt-1">Check-in and check-out visitors</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="card-hover p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-500">Awaiting Check-in</p>
                  <p className="text-xl font-bold text-amber-600">{stats.approved?.count || 0}</p>
                </div>
              </div>
            </div>
            <div className="card-hover p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <LogIn size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-500">Currently Inside</p>
                  <p className="text-xl font-bold text-purple-600">{stats.checkedIn?.count || 0}</p>
                </div>
              </div>
            </div>
            <div className="card-hover p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center">
                  <UserCheck size={20} className="text-success" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-500">Today's Total</p>
                  <p className="text-xl font-bold text-success">{todayCount}</p>
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
          <div className="flex items-center gap-1 bg-white border border-surface-100 rounded-xl p-1">
            {['all', 'Approved', 'Checked-In', 'Checked-Out'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === s ? 'bg-surface-900 text-white' : 'text-surface-500 hover:bg-surface-50'
                }`}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Visitor Cards */}
        {loading ? <SkeletonList rows={4} /> : filtered.length === 0 ? (
          <EmptyState icon={Shield} title="No visitors"
            description={filter === 'all' ? "No approved visitors to manage." : `No ${filter.toLowerCase()} visitors.`} />
        ) : (
          <div className="space-y-3">
            {filtered.map(v => (
              <div key={v.id} className="card-hover p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    v.status === 'Approved' ? 'bg-success-50' :
                    v.status === 'Checked-In' ? 'bg-purple-100' : 'bg-surface-200'
                  }`}>
                    {v.status === 'Checked-In' ? <LogIn size={22} className="text-purple-600" /> :
                     v.status === 'Approved' ? <CheckCircle size={22} className="text-success" /> :
                     <LogOut size={22} className="text-surface-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-surface-900 text-lg">{v.name}</h3>
                      <span className={STATUS_BADGES[v.status]}>{v.status}</span>
                    </div>
                    <p className="text-sm text-surface-500 mb-2">{v.purpose}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-surface-600">
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 bg-brand-100 rounded flex items-center justify-center text-[10px] font-bold text-brand-600">
                          {(v.apartment_number || '?')[0]}
                        </span>
                        {v.resident_name || '---'} {v.apartment_number && `(${v.apartment_number})`}
                      </span>
                      <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(v.visit_date).toLocaleDateString()}</span>
                      {v.expected_time && <span className="flex items-center gap-1"><Clock size={14} /> {v.expected_time}</span>}
                      {v.vehicle_number && <span className="flex items-center gap-1"><Car size={14} /> {v.vehicle_number}</span>}
                      {v.phone && <span className="flex items-center gap-1"><Phone size={14} /> {v.phone}</span>}
                    </div>
                    {v.checked_in_at && (
                      <p className="text-xs text-purple-600 mt-2 font-medium">
                        Checked in: {new Date(v.checked_in_at).toLocaleString()}
                        {v.checked_out_at && ` | Checked out: ${new Date(v.checked_out_at).toLocaleString()}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setSelectedVisitor(v)} className="btn-ghost btn-sm"><Eye size={14} /></button>
                    {v.status === 'Approved' && (
                      <button onClick={() => { setActionModal({ ...v, action: 'checkin' }); setActionNote(''); }}
                        className="btn-brand btn-sm"><LogIn size={14} /> Check In</button>
                    )}
                    {v.status === 'Checked-In' && (
                      <button onClick={() => { setActionModal({ ...v, action: 'checkout' }); setActionNote(''); }}
                        className="btn-secondary btn-sm"><LogOut size={14} /> Check Out</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
                  ['Registered By', selectedVisitor.resident_name],
                  ['Apartment', selectedVisitor.apartment_number],
                  ['Approved At', selectedVisitor.approved_at ? new Date(selectedVisitor.approved_at).toLocaleString() : null],
                  ['Checked In At', selectedVisitor.checked_in_at ? new Date(selectedVisitor.checked_in_at).toLocaleString() : null],
                  ['Checked Out At', selectedVisitor.checked_out_at ? new Date(selectedVisitor.checked_out_at).toLocaleString() : null],
                ].filter(([, val]) => val).map(([label, value, badge]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-surface-100">
                    <span className="text-sm text-surface-500">{label}</span>
                    {badge ? <span className={badge}>{value}</span> : <span className="text-sm font-semibold text-surface-900">{value}</span>}
                  </div>
                ))}
              </div>
              {selectedVisitor.status === 'Approved' && (
                <button onClick={() => { setActionModal({ ...selectedVisitor, action: 'checkin' }); setSelectedVisitor(null); setActionNote(''); }}
                  className="btn-brand w-full mt-6"><LogIn size={16} /> Check In</button>
              )}
              {selectedVisitor.status === 'Checked-In' && (
                <button onClick={() => { setActionModal({ ...selectedVisitor, action: 'checkout' }); setSelectedVisitor(null); setActionNote(''); }}
                  className="btn-secondary w-full mt-6"><LogOut size={16} /> Check Out</button>
              )}
            </div>
          </div>
        )}

        {/* Check-in/out Modal */}
        {actionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-surface-900/30 backdrop-blur-sm" onClick={() => setActionModal(null)} />
            <div className="relative bg-white rounded-2xl shadow-elevated w-full max-w-sm p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-display-sm text-surface-900">
                  {actionModal.action === 'checkin' ? 'Check In' : 'Check Out'}
                </h2>
                <button onClick={() => setActionModal(null)} className="p-2 rounded-lg hover:bg-surface-100"><X size={18} /></button>
              </div>
              <p className="text-sm text-surface-500 mb-4">
                {actionModal.action === 'checkin'
                  ? `Confirm check-in for ${actionModal.name}?`
                  : `Confirm check-out for ${actionModal.name}?`}
              </p>
              <div className="mb-4">
                <label className="label">Note (optional)</label>
                <input type="text" className="input w-full" value={actionNote}
                  onChange={e => setActionNote(e.target.value)} placeholder="Optional note" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setActionModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={actionModal.action === 'checkin' ? handleCheckIn : handleCheckOut}
                  className={actionModal.action === 'checkin' ? 'btn-brand flex-1' : 'btn-secondary flex-1'}>
                  {actionModal.action === 'checkin' ? 'Check In' : 'Check Out'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
