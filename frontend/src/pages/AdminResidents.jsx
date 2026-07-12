import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Users,
  Search,
  SlidersHorizontal,
  X,
  Edit2,
  Trash2,
  Ban,
  CheckCircle,
  Eye,
  AlertCircle,
} from 'lucide-react';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import { SkeletonTable } from '../components/Skeletons';

export default function AdminResidents() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    sort: '',
  });

  // Edit modal state
  const [editModal, setEditModal] = useState({ open: false, resident: null });
  const [editForm, setEditForm] = useState({ name: '', email: '', apartment_number: '', phone: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetchResidents();
  }, [filters.status, filters.sort]);

  const fetchResidents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.sort) params.append('sort', filters.sort);

      const res = await axios.get(`/api/admin/residents?${params}`);
      setResidents(res.data);
    } catch (err) {
      console.error('Error fetching residents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResidents();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ search: '', status: '', sort: '' });
    fetchResidents();
  };

  const hasActiveFilters = filters.status || filters.sort;

  // Edit
  const openEdit = (resident) => {
    setEditForm({
      name: resident.name,
      email: resident.email,
      apartment_number: resident.apartment_number || '',
      phone: resident.phone || '',
    });
    setEditModal({ open: true, resident });
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    try {
      await axios.put(`/api/admin/residents/${editModal.resident.id}`, editForm);
      setEditModal({ open: false, resident: null });
      fetchResidents();
    } catch (err) {
      setEditError(err.response?.data?.error || 'Failed to update resident');
    } finally {
      setEditLoading(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (resident) => {
    const action = resident.is_active ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${action} ${resident.name}?`)) return;
    try {
      await axios.put(`/api/admin/residents/${resident.id}/toggle-status`);
      fetchResidents();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  // Delete
  const handleDelete = async (resident) => {
    if (!window.confirm(`Permanently delete ${resident.name}? This will also delete all their complaints.`)) return;
    try {
      await axios.delete(`/api/admin/residents/${resident.id}`);
      fetchResidents();
    } catch (err) {
      console.error('Error deleting resident:', err);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-display-lg text-surface-900">Residents</h1>
          <p className="text-surface-500 mt-1">Manage society residents and their accounts</p>
        </div>

        {/* Search + Filters */}
        <div className="card p-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Search by name, email, apartment, or phone..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input pl-10"
              />
            </div>
            <button type="submit" className="btn-brand hidden sm:inline-flex">Search</button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary relative ${showFilters ? 'bg-surface-100' : ''}`}
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </form>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-surface-100 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-slide-up">
              <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => { handleFilterChange('status', e.target.value); }}
                  className="input text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Sort By</label>
                <select
                  value={filters.sort}
                  onChange={(e) => { handleFilterChange('sort', e.target.value); }}
                  className="input text-sm"
                >
                  <option value="">Newest First</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="apartment">Apartment</option>
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={() => { resetFilters(); }} className="btn-ghost btn-sm w-full text-surface-500">
                  <X size={14} /> Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-surface-500">
            Showing <span className="font-semibold text-surface-700">{residents.length}</span> resident{residents.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Table */}
        {loading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : residents.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No residents found"
            description={filters.search || hasActiveFilters ? "Try adjusting your search or filters." : "No residents have registered yet."}
            actionLabel={hasActiveFilters ? "Reset Filters" : undefined}
            onAction={hasActiveFilters ? resetFilters : undefined}
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Resident</th>
                  <th className="hidden md:table-cell">Contact</th>
                  <th>Apt No.</th>
                  <th>Status</th>
                  <th className="hidden lg:table-cell">Complaints</th>
                  <th className="hidden lg:table-cell">Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {residents.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {r.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/residents/${r.id}`}
                            className="font-medium text-surface-900 hover:text-brand-600 transition-colors block truncate"
                          >
                            {r.name}
                          </Link>
                          <p className="text-xs text-surface-400 truncate">{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <p className="text-sm text-surface-600">{r.phone || '---'}</p>
                    </td>
                    <td>
                      <span className="badge-surface font-mono">{r.apartment_number || '---'}</span>
                    </td>
                    <td>
                      {r.is_active ? (
                        <span className="badge-green">Active</span>
                      ) : (
                        <span className="badge-red">Disabled</span>
                      )}
                    </td>
                    <td className="hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-surface-600 font-medium">{r.complaints?.total || 0} total</span>
                        {(r.complaints?.open_count > 0) && (
                          <span className="text-blue-600">({r.complaints.open_count} open)</span>
                        )}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell text-xs text-surface-500 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/residents/${r.id}`}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="View Profile"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => openEdit(r)}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(r)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            r.is_active
                              ? 'text-surface-400 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-surface-400 hover:text-success hover:bg-success-50'
                          }`}
                          title={r.is_active ? 'Disable' : 'Enable'}
                        >
                          {r.is_active ? <Ban size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-danger hover:bg-danger-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-surface-900/30 backdrop-blur-sm"
            onClick={() => setEditModal({ open: false, resident: null })}
          />
          <div className="relative bg-white rounded-2xl shadow-elevated w-full max-w-lg animate-slide-up">
            <div className="flex items-center justify-between p-6 pb-0">
              <h2 className="text-lg font-bold text-surface-900">Edit Resident</h2>
              <button
                onClick={() => setEditModal({ open: false, resident: null })}
                className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400"
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="mx-6 mt-4 p-3 bg-danger-50 border border-danger-100 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} className="text-danger flex-shrink-0" />
                <p className="text-sm text-danger">{editError}</p>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  className="input"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  className="input"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Apartment Number</label>
                  <input
                    type="text"
                    className="input"
                    value={editForm.apartment_number}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, apartment_number: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    className="input"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={editLoading} className="btn-brand flex-1">
                  {editLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditModal({ open: false, resident: null })}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
