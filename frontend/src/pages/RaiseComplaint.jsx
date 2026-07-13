import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Upload, AlertCircle, CheckCircle, X } from 'lucide-react';
import Layout from '../components/Layout';

const categories = [
  'Plumbing', 'Electrical', 'Cleaning', 'Maintenance',
  'Security', 'Pest Control', 'Painting', 'Other',
];

export default function RaiseComplaint() {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Plumbing',
    description: '',
    photo: null,
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size must be less than 5MB');
        return;
      }
      setError('');
      setFormData((prev) => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, photo: null }));
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please enter a description');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('category', formData.category);
      data.append('description', formData.description);
      if (formData.photo) data.append('photo', formData.photo);

      await api.post('/api/complaints', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess('Complaint submitted successfully!');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-display-lg text-surface-900">Raise a Complaint</h1>
          <p className="text-surface-500 mt-1">Report a maintenance issue and we will get it resolved</p>
        </div>

        {error && (
          <div className="p-3.5 bg-danger-50 border border-danger-100 rounded-xl flex items-center gap-3 animate-slide-up">
            <AlertCircle size={18} className="text-danger flex-shrink-0" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-success-50 border border-success-100 rounded-xl flex items-center gap-3 animate-slide-up">
            <CheckCircle size={18} className="text-success flex-shrink-0" />
            <p className="text-sm text-success-700">{success}</p>
          </div>
        )}

        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">Complaint Title *</label>
              <input
                type="text"
                name="title"
                className="input"
                placeholder="e.g. Leaking tap in bathroom"
                value={formData.title}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-surface-400 mt-1">Brief summary of the issue</p>
            </div>

            <div>
              <label className="label">Category *</label>
              <select
                name="category"
                className="input"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Description *</label>
              <textarea
                name="description"
                className="input min-h-[120px] resize-y"
                placeholder="Provide detailed information about the issue..."
                value={formData.description}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-surface-400 mt-1">Include details that can help resolve the issue faster</p>
            </div>

            <div>
              <label className="label">Photo <span className="text-surface-400 font-normal">(optional)</span></label>
              {photoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="max-h-64 rounded-xl border border-surface-200"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 w-7 h-7 bg-surface-900/70 hover:bg-surface-900 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <X size={14} />
                  </button>
                  <p className="text-xs text-surface-400 mt-2">Click below to change photo</p>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-surface-200 rounded-xl p-8 text-center hover:border-brand-300 hover:bg-brand-50/30 transition-colors">
                    <Upload size={28} className="mx-auto text-surface-300 mb-3" />
                    <p className="text-sm font-medium text-surface-700">Click to upload a photo</p>
                    <p className="text-xs text-surface-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                  </div>
                </label>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-brand flex-1">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Submit Complaint'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
