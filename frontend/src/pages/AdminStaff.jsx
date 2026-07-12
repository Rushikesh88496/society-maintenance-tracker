import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Wrench,
  Search,
  SlidersHorizontal,
  X,
  Edit2,
  Trash2,
  Ban,
  CheckCircle,
  Eye,
  AlertCircle,
  Plus,
} from 'lucide-react';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import { SkeletonTable } from '../components/Skeletons';

const STAFF_ROLES = ['Electrician', 'Plumber', 'Cleaner', 'Security', 'Gardener'];

const ROLE_COLORS = {
  Electrician: 'bg-amber-100 text-amber-700',
  Plumber: 'bg-blue-100 text-blue-700',
  Cleaner: 'bg-emerald-100 text-emerald-700',
  Security: 'bg-purple-100 text-purple-700',
  Gardener: 'bg-green-100 text-green-700',
};

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    sort: '',
  });

  // Modal state
  const EMPTY_FORM = { name: '', role: '', phone: '', email: '' };
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const [editModal, setEditModal] = useState({ open: false, member: null });
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetchStaff();
  }, [filters.role, filters.status, filters.sort]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.sort) params.append('sort', filters.sort);

      const res = await axios.get(`/api/admin/staff?${params}`);
      setStaff(res.data);
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStaff();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ search: '', role: '', status: '', sort: '' });
    fetchStaff();
  };

  const hasActiveFilters = filters.role || filters.status || filters.sort;

  // Add
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    try {
      await axios.post('/api/admin/staff', addForm);
      setAddModal(false);
      setAddForm(EMPTY_FORM);
      fetchStaff();
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to add staff member');
    } finally {
      setAddLoading(false);
    }
  };

  // Edit
  const openEdit = (member) => {
    setEditForm({
      name: member.name,
      role: member.role,
      phone: member.phone || '',
      email: member.email || '',
    });
    setEditModal({ open: true, member });
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    try {
      await axios.put(`/api/admin/staff/${editModal.member.id}`, editForm);
      setEditModal({ open: false, member: null });
      fetchStaff();
    } catch (err) {
      setEditError(err.response?.data?.error || 'Failed to update staff member');
    } finally {
      setEditLoading(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (member) => {
    const action = member.is_active ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${action} ${member.name}?`)) return;
    try {
      await axios.put(`/api/admin/staff/${member.id}/toggle-status`);
      fetchStaff();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  // Delete
  const handleDelete = async (member) => {
    if (!window.confirm(`Permanently delete ${member.name}? Their assigned complaints will be unassigned.`)) return;
    try {
      await axios.delete(`/api/admin/staff/${member.id}`);
      fetchStaff();
    } catch (err) {
      console.error('Error deleting staff:', err);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display-lg text-surface-900">Staff</h1>
            <p className="text-surface-500 mt-1">Manage maintenance staff and their roles</p>
          </div>
          <button onClick={() => { setAddModal(true); setAddForm(EMPTY_FORM); setAddError(''); }} className="btn-brand">
            <Plus size={16} /> Add Staff
          </button>
        </div>

        {/* Search + Filters */}
        <div className="card p-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone, or role..."
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
            <div className="mt-4 pt-4 border-t border-surface-100 grid grid-cols-1 sm:grid-cols-4 gap-3 animate-slide-up">
              <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="input text-sm"
                >
                  <option value="">All Roles</option>
                  {STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
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
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="input text-sm"
                >
                  <option value="">Newest First</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="role">Role</option>
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={resetFilters} className="btn-ghost btn-sm w-full text-surface-500">
                  <X size={14} /> Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-surface-500">
            Showing <span className="font-semibold text-surface-700">{staff.length}</span> staff member{staff.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Table */}
        {loading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : staff.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No staff found"
            description={filters.search || hasActiveFilters ? 'Try adjusting your search or filters.' : 'No staff members added yet.'}
            actionLabel={hasActiveFilters ? 'Reset Filters' : 'Add Staff Member'}
            onAction={hasActiveFilters ? resetFilters : () => setAddModal(true)}
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th className="hidden md:table-cell">Contact</th>
                  <th>Status</th>
                  <th className="hidden lg:table-cell">Assigned</th>
                  <th className="hidden lg:table-cell">Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${ROLE_COLORS[s.role] || 'bg-surface-100 text-surface-600'}`}>
                          {s.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/staff/${s.id}`}
                            className="font-medium text-surface-900 hover:text-brand-600 transition-colors block truncate"
                          >
                            {s.name}
                          </Link>
                          <p className="text-xs text-surface-400 truncate">{s.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[s.role] || 'bg-surface-100 text-surface-600'}`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="hidden md:table-cell">
                      <p className="text-sm text-surface-600">{s.phone || '---'}</p>
                    </td>
                    <td>
                      {s.is_active ? (
                        <span className="badge-green">Active</span>
                      ) : (
                        <span className="badge-red">Disabled</span>
                      )}
                    </td>
                    <td className="hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-surface-600 font-medium">{s.complaints?.total || 0} total</span>
                        {(s.complaints?.open_count > 0) && (
                          <span className="text-blue-600">({s.complaints.open_count} open)</span>
                        )}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell text-xs text-surface-500 whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/staff/${s.id}`}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="View Profile"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(s)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            s.is_active
                              ? 'text-surface-400 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-surface-400 hover:text-success hover:bg-success-50'
                          }`}
                          title={s.is_active ? 'Disable' : 'Enable'}
                        >
                          {s.is_active ? <Ban size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
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

      {/* Add Modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-900/30 backdrop-blur-sm" onClick={() => setAddModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-elevated w-full max-w-lg animate-slide-up">
            <div className="flex items-center justify-between p-6 pb-0">
              <h2 className="text-lg font-bold text-surface-900">Add Staff Member</h2>
              <button onClick={() => setAddModal(false)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400">
                <X size={18} />
              </button>
            </div>

            {addError && (
              <div className="mx-6 mt-4 p-3 bg-danger-50 border border-danger-100 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} className="text-danger flex-shrink-0" />
                <p className="text-sm text-danger">{addError}</p>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  className="input"
                  value={addForm.name}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>
              <div>
                <label className="label">Role *</label>
                <select
                  className="input"
                  value={addForm.role}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, role: e.target.value }))}
                  required
                >
                  <option value="">Select a role</option>
                  {STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    className="input"
                    value={addForm.phone}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={addForm.email}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="optional@email.com"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={addLoading} className="btn-brand flex-1">
                  {addLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Add Staff Member'
                  )}
                </button>
                <button type="button" onClick={() => setAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-900/30 backdrop-blur-sm" onClick={() => setEditModal({ open: false, member: null })} />
          <div className="relative bg-white rounded-2xl shadow-elevated w-full max-w-lg animate-slide-up">
            <div className="flex items-center justify-between p-6 pb-0">
              <h2 className="text-lg font-bold text-surface-900">Edit Staff Member</h2>
              <button onClick={() => setEditModal({ open: false, member: null })} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400">
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
                <label className="label">Role *</label>
                <select
                  className="input"
                  value={editForm.role}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                  required
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    className="input"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={editForm.email}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
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
                <button type="button" onClick={() => setEditModal({ open: false, member: null })} className="btn-secondary">
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
