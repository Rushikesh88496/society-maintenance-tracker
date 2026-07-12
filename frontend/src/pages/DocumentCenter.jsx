import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Search, File, FileImage, FileText, Download, Trash2, X, Filter, FolderOpen } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const categoryOptions = ['General', 'Policy', 'Circular', 'Receipt', 'Agreement', 'Notice', 'Other'];
const typeIcons = {
  'application/pdf': { icon: FileText, color: 'text-red-500', bg: 'bg-red-100' },
  'image/': { icon: FileImage, color: 'text-blue-500', bg: 'bg-blue-100' },
  'default': { icon: File, color: 'text-surface-500', bg: 'bg-surface-100' },
};

function getFileIcon(mimeType) {
  if (mimeType?.startsWith('image/')) return typeIcons['image/'];
  if (mimeType === 'application/pdf') return typeIcons['application/pdf'];
  return typeIcons['default'];
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function DocumentCenter() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('General');
  const [description, setDescription] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');

  const { auth } = useAuth();
  const isAdmin = auth?.user?.role === 'admin';

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await axios.get('/api/documents', { params });
      setDocuments(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchDocs, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search, category]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', uploadCategory);
      formData.append('description', description);
      await axios.post('/api/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowUpload(false);
      setFile(null);
      setUploadCategory('General');
      setDescription('');
      fetchDocs();
    } catch (e) {
      setError(e.response?.data?.error || 'Upload failed');
    }
    setUploading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    setDeleting(id);
    try {
      await axios.delete(`/api/documents/${id}`);
      fetchDocs();
    } catch (e) {
      console.error(e);
    }
    setDeleting(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Document Center</h1>
            <p className="text-sm text-surface-500 mt-1">Manage and access all society documents</p>
          </div>
          <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2">
            <Upload size={16} /> Upload Document
          </button>
        </div>

        <div className="card p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-9 w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-surface-400" />
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="input"
              >
                <option value="">All Categories</option>
                {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="p-12 text-center text-surface-400">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center">
              <FolderOpen size={48} className="mx-auto text-surface-300 mb-3" />
              <p className="text-surface-500 font-medium">No documents found</p>
              <p className="text-sm text-surface-400 mt-1">Upload documents to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Size</th>
                    <th>Uploaded By</th>
                    <th>Date</th>
                    <th className="w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => {
                    const fType = getFileIcon(doc.file_type);
                    const Icon = fType.icon;
                    return (
                      <tr key={doc.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${fType.bg}`}>
                              <Icon size={18} className={fType.color} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-surface-900 truncate max-w-[250px]">{doc.name}</p>
                              {doc.description && <p className="text-xs text-surface-400 truncate max-w-[250px]">{doc.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td><span className="badge-purple">{doc.category}</span></td>
                        <td className="text-sm text-surface-500">{formatSize(doc.file_size)}</td>
                        <td className="text-sm text-surface-500">{doc.uploader_name || 'Unknown'}</td>
                        <td className="text-sm text-surface-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <a
                              href={doc.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg hover:bg-surface-100 text-brand-600"
                              title="Download"
                            >
                              <Download size={16} />
                            </a>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              disabled={deleting === doc.id}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-danger"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showUpload && (
          <div className="fixed inset-0 bg-surface-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-slide-up">
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
                <h2 className="text-lg font-semibold text-surface-900">Upload Document</h2>
                <button onClick={() => setShowUpload(false)} className="p-2 rounded-lg hover:bg-surface-100">
                  <X size={18} className="text-surface-500" />
                </button>
              </div>
              <form onSubmit={handleUpload} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-danger-50 text-danger rounded-lg text-sm">{error}</div>
                )}
                <div>
                  <label className="label">File</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt,.csv"
                    onChange={e => setFile(e.target.files[0])}
                    className="input w-full"
                    required
                  />
                  {file && (
                    <p className="text-xs text-surface-500 mt-1">{file.name} ({formatSize(file.size)})</p>
                  )}
                </div>
                <div>
                  <label className="label">Category</label>
                  <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className="input w-full">
                    {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="input w-full"
                    rows={2}
                    placeholder="Optional description..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowUpload(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={!file || uploading} className="btn-primary disabled:opacity-50">
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
