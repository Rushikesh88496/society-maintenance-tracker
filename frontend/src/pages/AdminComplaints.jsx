import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Search, SlidersHorizontal, X, AlertCircle, UserPlus } from 'lucide-react';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import { SkeletonTable } from '../components/Skeletons';

const categories = ['Plumbing', 'Electrical', 'Cleaning', 'Maintenance', 'Security', 'Pest Control', 'Painting', 'Other'];
const statuses = ['Open', 'Assigned', 'Work Started', 'In Progress', 'Resolved', 'Confirmed', 'Reopened'];
const priorities = ['Low', 'Medium', 'High'];

export default function AdminComplaints() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'latest',
  });

  useEffect(() => {
    fetchComplaints();
  }, [filters.category, filters.status, filters.priority, filters.sort]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);
      if (filters.sort === 'overdue') params.append('sort', 'overdue');
      if (filters.sort === 'priority') params.append('sort', 'priority');

      const res = await axios.get(`/api/complaints?${params}`);
      setComplaints(res.data);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ category: '', status: '', priority: '', search: '', sort: 'latest' });
    setSearchParams({});
  };

  const hasActiveFilters = filters.category || filters.status || filters.priority || filters.search;
  const activeFilterCount = [filters.category, filters.status, filters.priority, filters.search].filter(Boolean).length;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComplaints();
  };

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

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High': return 'badge-red';
      case 'Medium': return 'badge-amber';
      case 'Low': return 'badge-surface';
      default: return 'badge-surface';
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-display-lg text-surface-900">All Complaints</h1>
          <p className="text-surface-500 mt-1">Manage and track all maintenance complaints</p>
        </div>

        {/* Search + Filters */}
        <div className="card p-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Search by title, description, or ID..."
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
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </form>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-surface-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 animate-slide-up">
              <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="input text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
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
                  {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="input text-sm"
                >
                  <option value="">All Priorities</option>
                  {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-surface-500 mb-1 block">Sort By</label>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="input text-sm"
                >
                  <option value="latest">Latest First</option>
                  <option value="overdue">Overdue First</option>
                  <option value="priority">By Priority</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="btn-ghost btn-sm w-full text-surface-500"
                >
                  <X size={14} />
                  Reset All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-surface-500">
            Showing <span className="font-semibold text-surface-700">{complaints.length}</span> complaint{complaints.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Table */}
        {loading ? (
          <SkeletonTable rows={5} cols={7} />
        ) : complaints.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="No complaints found"
            description={hasActiveFilters ? "Try adjusting your filters or search criteria." : "No complaints have been raised yet."}
            actionLabel={hasActiveFilters ? "Reset Filters" : undefined}
            onAction={hasActiveFilters ? resetFilters : undefined}
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Complaint</th>
                  <th className="hidden md:table-cell">Category</th>
                  <th>Status</th>
                  <th className="hidden lg:table-cell">Assigned</th>
                  <th>Priority</th>
                  <th className="hidden sm:table-cell">Overdue</th>
                  <th className="hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link
                        to={`/complaint/${c.id}`}
                        className="font-medium text-surface-900 hover:text-brand-600 transition-colors block"
                      >
                        {c.title}
                      </Link>
                      <p className="text-xs text-surface-400 mt-0.5 font-mono">#{c.id.slice(0, 8)}</p>
                    </td>
                    <td className="hidden md:table-cell">
                      <span className="badge-surface">{c.category}</span>
                    </td>
                    <td>
                      <span className={getStatusBadge(c.status)}>{c.status}</span>
                    </td>
                    <td className="hidden lg:table-cell">
                      {c.staff_name ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                            {c.staff_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-surface-700 truncate">{c.staff_name}</p>
                            <p className="text-[10px] text-surface-400">{c.staff_role}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-surface-400 italic flex items-center gap-1">
                          <UserPlus size={12} /> Unassigned
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={getPriorityBadge(c.priority)}>{c.priority}</span>
                    </td>
                    <td className="hidden sm:table-cell">
                      {c.is_overdue ? (
                        <span className="badge-red">Overdue</span>
                      ) : (
                        <span className="text-surface-300">&mdash;</span>
                      )}
                    </td>
                    <td className="text-surface-500 text-xs whitespace-nowrap hidden md:table-cell">
                      {new Date(c.created_at).toLocaleDateString()}
                      <br />
                      <span className="text-surface-400">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
