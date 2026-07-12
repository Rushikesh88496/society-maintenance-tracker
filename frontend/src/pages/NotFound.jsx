import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto bg-brand-50 rounded-2xl flex items-center justify-center mb-6">
          <FileQuestion size={36} className="text-brand-400" />
        </div>
        <h1 className="text-6xl font-bold text-surface-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-surface-700 mb-2">Page not found</h2>
        <p className="text-surface-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-secondary">
            <ArrowLeft size={16} />
            Go Back
          </button>
          <Link to="/" className="btn-brand">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
