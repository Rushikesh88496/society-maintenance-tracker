import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pin, Plus, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/Skeletons';
import { useAuth } from '../context/AuthContext';

export default function NoticeBoard() {
  const { auth } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', is_important: false });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await axios.get('/api/notices');
      setNotices(res.data);
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/notices', formData);
      setFormData({ title: '', description: '', is_important: false });
      setShowForm(false);
      fetchNotices();
    } catch (err) {
      console.error('Error creating notice:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      try {
        await axios.delete(`/api/notices/${id}`);
        fetchNotices();
      } catch (err) {
        console.error('Error deleting notice:', err);
      }
    }
  };

  const isAdmin = auth?.user?.role === 'admin';

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-display-lg text-surface-900">Notice Board</h1>
            <p className="text-surface-500 mt-1">Important announcements and updates</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-brand"
            >
              <Plus size={18} />
              Post Notice
            </button>
          )}
        </div>

        {/* Admin Form */}
        {isAdmin && showForm && (
          <div className="card p-6 sm:p-8 border-2 border-brand-200 animate-slide-up">
            <h2 className="text-display-sm text-surface-900 mb-5">New Notice</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Title *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Notice title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Description *</label>
                <textarea
                  className="input min-h-[100px] resize-y"
                  placeholder="Write your notice here..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_important}
                  onChange={(e) => setFormData((prev) => ({ ...prev, is_important: e.target.checked }))}
                  className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex items-center gap-2">
                  <Pin size={14} className="text-danger" />
                  <span className="text-sm font-medium text-surface-700">Pin as important</span>
                  <span className="text-xs text-surface-400">(residents will receive email notification)</span>
                </div>
              </label>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="btn-brand">
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Post Notice'
                  )}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notices */}
        {loading ? (
          <SkeletonList rows={3} />
        ) : notices.length === 0 ? (
          <EmptyState
            icon={Pin}
            title="No notices"
            description={isAdmin ? 'Be the first to post an important notice!' : 'There are no notices at the moment.'}
            actionLabel={isAdmin ? 'Post Notice' : undefined}
            onAction={isAdmin ? () => setShowForm(true) : undefined}
          />
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className={`card p-6 ${
                  notice.is_important
                    ? 'border-l-4 border-l-danger bg-danger-50/30'
                    : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {notice.is_important && (
                      <div className="w-8 h-8 rounded-lg bg-danger-100 flex items-center justify-center flex-shrink-0">
                        <Pin size={14} className="text-danger" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-surface-900">{notice.title}</h3>
                      <p className="text-xs text-surface-500 mt-1">
                        Posted by <span className="font-medium text-surface-700">{notice.creator_name || 'Admin'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {notice.is_important && (
                      <span className="badge-red">Important</span>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(notice.id)}
                        className="btn-ghost btn-sm text-danger hover:bg-danger-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-surface-600 leading-relaxed whitespace-pre-wrap mb-4">
                  {notice.description}
                </p>

                <div className="pt-3 border-t border-surface-100">
                  <p className="text-xs text-surface-400">
                    {new Date(notice.created_at).toLocaleDateString()} at{' '}
                    {new Date(notice.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
