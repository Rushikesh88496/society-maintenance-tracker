import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ChevronLeft,
  Mail,
  Phone,
  Home,
  Calendar,
  AlertCircle,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import Layout from '../components/Layout';
import { SkeletonDetail } from '../components/Skeletons';

export default function AdminResidentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resident, setResident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResident();
  }, [id]);

  const fetchResident = async () => {
    try {
      const res = await axios.get(`/api/admin/residents/${id}`);
      setResident(res.data);
    } catch (err) {
      console.error('Error fetching resident:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    const action = resident.is_active ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${action} ${resident.name}?`)) return;
    try {
      const res = await axios.put(`/api/admin/residents/${resident.id}/toggle-status`);
      setResident((prev) => ({ ...prev, is_active: res.data.is_active }));
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open': return 'badge-blue';
      case 'In Progress': return 'badge-amber';
      case 'Resolved': return 'badge-green';
      default: return 'badge-surface';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High': return 'badge-red';
      case 'Medium': return 'badge-amber';
      case 'Low': return 'badge-surface';
      default: return 'badge-surface';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto"><SkeletonDetail /></div>
      </Layout>
    );
  }

  if (!resident) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/residents')} className="btn-ghost mb-6">
            <ChevronLeft size={16} /> Back to Residents
          </button>
          <div className="card p-12 text-center">
            <AlertCircle size={40} className="mx-auto text-surface-300 mb-4" />
            <h2 className="text-lg font-semibold text-surface-900">Resident Not Found</h2>
            <p className="text-sm text-surface-500 mt-1">This resident does not exist or has been removed.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const initials = resident.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const stats = resident.complaintStats || {};

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => navigate('/residents')} className="btn-ghost -ml-2">
          <ChevronLeft size={16} /> Back to Residents
        </button>

        {/* Profile Card */}
        <div className="card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-display-sm text-surface-900">{resident.name}</h1>
                    {resident.is_active ? (
                      <span className="badge-green">Active</span>
                    ) : (
                      <span className="badge-red">Disabled</span>
                    )}
                  </div>
                  <p className="text-sm text-surface-500 mt-1">
                    Resident since {new Date(resident.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={handleToggleStatus}
                  className={resident.is_active ? 'btn-secondary text-danger border-danger-100 hover:bg-danger-50' : 'btn-success'}
                >
                  {resident.is_active ? (
                    <><Ban size={16} /> Disable Account</>
                  ) : (
                    <><CheckCircle2 size={16} /> Enable Account</>
                  )}
                </button>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-surface-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-100 flex items-center justify-center flex-shrink-0">
                    <Mail size={16} className="text-surface-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-surface-500">Email</p>
                    <p className="text-sm font-medium text-surface-900">{resident.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-100 flex items-center justify-center flex-shrink-0">
                    <Home size={16} className="text-surface-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-surface-500">Apartment</p>
                    <p className="text-sm font-medium text-surface-900">{resident.apartment_number || '---'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-100 flex items-center justify-center flex-shrink-0">
                    <Phone size={16} className="text-surface-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-surface-500">Phone</p>
                    <p className="text-sm font-medium text-surface-900">{resident.phone || '---'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-100 flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} className="text-surface-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-surface-500">Joined</p>
                    <p className="text-sm font-medium text-surface-900">
                      {new Date(resident.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Complaint Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card-hover p-4">
            <p className="text-xs font-medium text-surface-500">Total</p>
            <p className="text-2xl font-bold text-surface-900 mt-1">{stats.total || 0}</p>
          </div>
          <div className="card-hover p-4">
            <p className="text-xs font-medium text-surface-500">Open</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.open_count || 0}</p>
          </div>
          <div className="card-hover p-4">
            <p className="text-xs font-medium text-surface-500">In Progress</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.in_progress_count || 0}</p>
          </div>
          <div className="card-hover p-4">
            <p className="text-xs font-medium text-surface-500">Resolved</p>
            <p className="text-2xl font-bold text-success mt-1">{stats.resolved_count || 0}</p>
          </div>
        </div>

        {/* Complaint History */}
        <div className="card">
          <div className="p-6 pb-0">
            <h2 className="text-display-sm text-surface-900">Complaint History</h2>
          </div>

          {resident.complaints && resident.complaints.length > 0 ? (
            <div className="mt-4 table-wrapper rounded-t-none border-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>Complaint</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th className="hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {resident.complaints.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link
                          to={`/complaint/${c.id}`}
                          className="font-medium text-surface-900 hover:text-brand-600 transition-colors"
                        >
                          {c.title}
                        </Link>
                        <p className="text-xs text-surface-400 font-mono mt-0.5">#{c.id.slice(0, 8)}</p>
                      </td>
                      <td>
                        <span className="badge-surface">{c.category}</span>
                      </td>
                      <td>
                        <span className={getStatusBadge(c.status)}>{c.status}</span>
                      </td>
                      <td>
                        <span className={getPriorityBadge(c.priority)}>{c.priority}</span>
                      </td>
                      <td className="text-surface-500 text-xs whitespace-nowrap hidden sm:table-cell">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <AlertCircle size={32} className="mx-auto text-surface-300 mb-3" />
              <p className="text-sm text-surface-500">No complaints from this resident yet.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
