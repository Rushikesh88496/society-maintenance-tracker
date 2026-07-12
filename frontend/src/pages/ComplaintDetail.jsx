import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  Pencil,
  Calendar,
  Tag,
  User,
  UserPlus,
  CalendarClock,
  Play,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import Layout from '../components/Layout';
import ComplaintTimeline from '../components/ComplaintTimeline';
import ProgressStepper from '../components/ProgressStepper';
import { SkeletonDetail } from '../components/Skeletons';
import { useAuth } from '../context/AuthContext';

const VALID_TRANSITIONS = {
  'Open': ['Assigned', 'In Progress', 'Resolved'],
  'Assigned': ['Work Started', 'In Progress', 'Resolved', 'Open'],
  'Work Started': ['In Progress', 'Resolved'],
  'In Progress': ['Resolved', 'Work Started'],
  'Resolved': ['Confirmed', 'Reopened'],
  'Reopened': ['In Progress', 'Assigned', 'Work Started'],
  'Confirmed': [],
};

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);

  const [updateData, setUpdateData] = useState({ status: '', priority: '', note: '' });
  const [staffList, setStaffList] = useState([]);
  const [assignData, setAssignData] = useState({ assigned_to: '', expected_completion: '', note: '' });

  // Resident confirmation
  const [confirmNote, setConfirmNote] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  const isAdmin = auth?.user?.role === 'admin';
  const isResident = auth?.user?.role === 'resident';

  useEffect(() => {
    fetchComplaint();
    if (isAdmin) fetchStaff();
  }, [id]);

  // SSE for live updates
  useEffect(() => {
    if (!complaint) return;
    const apiBase = import.meta.env.VITE_API_URL || '';
    const eventSource = new EventSource(`${apiBase}/api/complaints/${id}/stream`);
    eventSource.onmessage = () => {
      fetchComplaint();
    };
    return () => eventSource.close();
  }, [id, complaint !== null]);

  const fetchComplaint = async () => {
    try {
      const res = await axios.get(`/api/complaints/${id}`);
      setComplaint(res.data);
      setUpdateData({ status: res.data.status, priority: res.data.priority, note: '' });
    } catch (err) {
      console.error('Error fetching complaint:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await axios.get(`/api/complaints/${id}/available-staff`);
      setStaffList(res.data);
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  };

  // Admin: update status/priority
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await axios.put(`/api/complaints/${id}/status`, {
        status: updateData.status,
        priority: updateData.priority,
        note: updateData.note,
      });
      setShowUpdateForm(false);
      fetchComplaint();
    } catch (err) {
      console.error('Error updating complaint:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Admin: assign staff
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await axios.put(`/api/complaints/${id}/status`, {
        assigned_to: assignData.assigned_to || null,
        expected_completion: assignData.expected_completion || null,
        note: assignData.note || null,
      });
      setShowAssignForm(false);
      fetchComplaint();
    } catch (err) {
      console.error('Error assigning staff:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Resident: confirm/reject resolution
  const handleConfirm = async (confirmed) => {
    setConfirmLoading(true);
    try {
      await axios.put(`/api/complaints/${id}/confirm`, {
        confirmed,
        note: confirmNote || undefined,
      });
      setConfirmNote('');
      fetchComplaint();
    } catch (err) {
      console.error('Error confirming:', err);
    } finally {
      setConfirmLoading(false);
    }
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

  const availableTransitions = complaint ? (VALID_TRANSITIONS[complaint.status] || []) : [];

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto"><SkeletonDetail /></div>
      </Layout>
    );
  }

  if (!complaint) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate(-1)} className="btn-ghost mb-6">
            <ChevronLeft size={16} /> Back
          </button>
          <div className="card p-12 text-center">
            <AlertCircle size={40} className="mx-auto text-surface-300 mb-4" />
            <h2 className="text-lg font-semibold text-surface-900">Complaint Not Found</h2>
            <p className="text-sm text-surface-500 mt-1">This complaint does not exist or has been removed.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="btn-ghost -ml-2">
          <ChevronLeft size={16} /> Back
        </button>

        {/* Progress Stepper */}
        <div className="card p-6">
          <ProgressStepper status={complaint.status} />
        </div>

        {/* Main Card */}
        <div className="card p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-surface-100">
            <div>
              <h1 className="text-display-sm text-surface-900">{complaint.title}</h1>
              <p className="text-sm text-surface-400 font-mono mt-1">#{complaint.id.slice(0, 8)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={getStatusBadge(complaint.status)}>{complaint.status}</span>
              <span className={getPriorityBadge(complaint.priority)}>{complaint.priority} Priority</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-6 border-b border-surface-100">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-100 flex items-center justify-center flex-shrink-0">
                <Tag size={16} className="text-surface-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-surface-500">Category</p>
                <p className="text-sm font-semibold text-surface-900">{complaint.category}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-100 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-surface-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-surface-500">Reported By</p>
                <p className="text-sm font-semibold text-surface-900">{complaint.resident?.name}</p>
                {complaint.resident?.apartment_number && (
                  <p className="text-xs text-surface-500">Apt: {complaint.resident.apartment_number}</p>
                )}
              </div>
            </div>

            {/* Assigned Staff */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                <UserPlus size={16} className="text-purple-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-surface-500">Assigned To</p>
                {complaint.staff_name ? (
                  <div>
                    <p className="text-sm font-semibold text-surface-900">{complaint.staff_name}</p>
                    <p className="text-xs text-surface-500">{complaint.staff_role}</p>
                  </div>
                ) : (
                  <p className="text-sm text-surface-400 italic">Not assigned</p>
                )}
              </div>
            </div>

            {/* Expected Completion */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-100 flex items-center justify-center flex-shrink-0">
                <CalendarClock size={16} className="text-surface-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-surface-500">Expected Completion</p>
                {complaint.expected_completion ? (
                  <p className="text-sm font-semibold text-surface-900">
                    {new Date(complaint.expected_completion).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="text-sm text-surface-400 italic">Not set</p>
                )}
              </div>
            </div>

            {/* Created */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-100 flex items-center justify-center flex-shrink-0">
                <Calendar size={16} className="text-surface-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-surface-500">Created</p>
                <p className="text-sm font-semibold text-surface-900">
                  {new Date(complaint.created_at).toLocaleDateString()}
                </p>
                <p className="text-xs text-surface-500">
                  {new Date(complaint.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>

            {/* Work Started */}
            {complaint.work_started_at && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Play size={16} className="text-indigo-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-500">Work Started</p>
                  <p className="text-sm font-semibold text-indigo-600">
                    {new Date(complaint.work_started_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-surface-500">
                    {new Date(complaint.work_started_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}

            {/* Resolved */}
            {complaint.resolved_at && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-success-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={16} className="text-success" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-500">Resolved</p>
                  <p className="text-sm font-semibold text-success-700">
                    {new Date(complaint.resolved_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-surface-500">
                    {new Date(complaint.resolved_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}

            {/* Confirmed */}
            {complaint.confirmed_at && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-500">Confirmed by Resident</p>
                  <p className="text-sm font-semibold text-green-700">
                    {new Date(complaint.confirmed_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-surface-500">
                    {new Date(complaint.confirmed_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Photo */}
          {complaint.photo_path && (
            <div className="py-6 border-b border-surface-100">
              <p className="text-xs font-medium text-surface-500 mb-3">Attached Photo</p>
              <img
                src={complaint.photo_path}
                alt="Complaint"
                className="max-h-80 rounded-xl border border-surface-200"
              />
            </div>
          )}

          {/* Description */}
          <div className="pt-6">
            <p className="text-xs font-medium text-surface-500 mb-2">Description</p>
            <p className="text-sm text-surface-700 leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </p>
          </div>
        </div>

        {/* Resident Confirmation */}
        {isResident && complaint.status === 'Resolved' && (
          <div className="card p-6 sm:p-8 border-2 border-success-200 bg-success-50/30">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-success-100 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={22} className="text-success" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-surface-900">Confirm Resolution</h3>
                <p className="text-sm text-surface-600 mt-1">
                  This complaint has been marked as resolved. Please confirm if the issue has been addressed, or reopen if it hasn't.
                </p>
                <div className="mt-4">
                  <label className="label">Note <span className="text-surface-400 font-normal">(optional)</span></label>
                  <textarea
                    className="input min-h-[60px] resize-y bg-white"
                    placeholder="Add a comment..."
                    value={confirmNote}
                    onChange={(e) => setConfirmNote(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleConfirm(true)}
                    disabled={confirmLoading}
                    className="btn-success"
                  >
                    <ShieldCheck size={16} /> Confirm Resolution
                  </button>
                  <button
                    onClick={() => handleConfirm(false)}
                    disabled={confirmLoading}
                    className="btn-secondary text-danger border-danger-100 hover:bg-danger-50"
                  >
                    <RotateCcw size={16} /> Reopen Complaint
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin: Quick Actions */}
        {isAdmin && (
          <div className="card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-display-sm text-surface-900">Manage Complaint</h2>
              <div className="flex gap-2">
                {!showAssignForm && (
                  <button onClick={() => { setShowAssignForm(true); setShowUpdateForm(false); }} className="btn-secondary btn-sm">
                    <UserPlus size={14} /> Assign Staff
                  </button>
                )}
                {!showUpdateForm && availableTransitions.length > 0 && (
                  <button onClick={() => { setShowUpdateForm(true); setShowAssignForm(false); }} className="btn-brand btn-sm">
                    <Pencil size={14} /> Update
                  </button>
                )}
              </div>
            </div>

            {/* Assign Staff Form */}
            {showAssignForm && (
              <form onSubmit={handleAssignSubmit} className="space-y-4 p-4 bg-surface-50 rounded-xl border border-surface-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Assign To</label>
                    <select
                      className="input"
                      value={assignData.assigned_to}
                      onChange={(e) => setAssignData((prev) => ({ ...prev, assigned_to: e.target.value }))}
                    >
                      <option value="">Unassigned</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Expected Completion</label>
                    <input
                      type="date"
                      className="input"
                      value={assignData.expected_completion}
                      onChange={(e) => setAssignData((prev) => ({ ...prev, expected_completion: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Note <span className="text-surface-400 font-normal">(optional)</span></label>
                  <textarea
                    className="input min-h-[60px] resize-y"
                    placeholder="Assignment note..."
                    value={assignData.note}
                    onChange={(e) => setAssignData((prev) => ({ ...prev, note: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={updating} className="btn-brand">
                    {updating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Assignment'}
                  </button>
                  <button type="button" onClick={() => setShowAssignForm(false)} className="btn-secondary">Cancel</button>
                </div>
              </form>
            )}

            {/* Status/Priority Update Form */}
            {showUpdateForm && (
              <form onSubmit={handleUpdateSubmit} className="space-y-4 p-4 bg-surface-50 rounded-xl border border-surface-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Status</label>
                    <select
                      className="input"
                      value={updateData.status}
                      onChange={(e) => setUpdateData((prev) => ({ ...prev, status: e.target.value }))}
                    >
                      <option value={complaint.status}>{complaint.status} (current)</option>
                      {availableTransitions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Priority</label>
                    <select
                      className="input"
                      value={updateData.priority}
                      onChange={(e) => setUpdateData((prev) => ({ ...prev, priority: e.target.value }))}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Note <span className="text-surface-400 font-normal">(optional)</span></label>
                  <textarea
                    className="input min-h-[60px] resize-y"
                    placeholder="Add a note for the resident..."
                    value={updateData.note}
                    onChange={(e) => setUpdateData((prev) => ({ ...prev, note: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={updating} className="btn-brand">
                    {updating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Update Complaint'}
                  </button>
                  <button type="button" onClick={() => setShowUpdateForm(false)} className="btn-secondary">Cancel</button>
                </div>
              </form>
            )}

            {!showUpdateForm && !showAssignForm && (
              <div className="text-center py-6">
                <p className="text-sm text-surface-400">
                  {availableTransitions.length > 0
                    ? `Current status: ${complaint.status}. Available actions: ${availableTransitions.join(', ')}`
                    : complaint.status === 'Confirmed'
                    ? 'This complaint is fully resolved and confirmed.'
                    : 'No actions available for current status.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="card p-6 sm:p-8">
          <h2 className="text-display-sm text-surface-900 mb-6">Activity Timeline</h2>
          <ComplaintTimeline history={complaint.history || []} />
        </div>
      </div>
    </Layout>
  );
}
