import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  DollarSign,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import { SkeletonCard, SkeletonList } from '../components/Skeletons';

const STATUS_BADGES = {
  Pending: 'badge-amber',
  Paid: 'badge-green',
  Overdue: 'badge-red',
  Cancelled: 'badge-surface',
};

export default function ResidentBills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await api.get('/api/bills');
      setBills(res.data);
    } catch (err) {
      console.error('Error fetching bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = bills.filter((b) => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const stats = {
    total: bills.length,
    pending: bills.filter((b) => b.status === 'Pending').length,
    paid: bills.filter((b) => b.status === 'Paid').length,
    overdue: bills.filter((b) => b.status === 'Overdue' || (b.status === 'Pending' && new Date(b.due_date) < new Date())).length,
    totalPending: bills.filter((b) => b.status === 'Pending' || b.status === 'Overdue').reduce((sum, b) => sum + b.amount, 0),
    totalPaid: bills.filter((b) => b.status === 'Paid').reduce((sum, b) => sum + (b.paid_amount || b.amount), 0),
  };

  const filterTabs = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'Pending', label: 'Pending', count: stats.pending },
    { key: 'Paid', label: 'Paid', count: stats.paid },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-display-lg text-surface-900">My Bills</h1>
          <p className="text-surface-500 mt-1">View and track your maintenance bills</p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="card-hover p-5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <DollarSign size={22} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-500">Total Bills</p>
                  <p className="text-2xl font-bold text-surface-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="card-hover p-5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Clock size={22} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-500">Amount Due</p>
                  <p className="text-2xl font-bold text-amber-600">₹{stats.totalPending.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="card-hover p-5 col-span-2 lg:col-span-1">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-success-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={22} className="text-success" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-500">Total Paid</p>
                  <p className="text-2xl font-bold text-success">₹{stats.totalPaid.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-white border border-surface-100 rounded-xl p-1 w-fit">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                filter === tab.key ? 'bg-surface-900 text-white shadow-sm' : 'text-surface-500 hover:text-surface-700 hover:bg-surface-50'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${filter === tab.key ? 'text-white/70' : 'text-surface-400'}`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Bills List */}
        {loading ? (
          <SkeletonList rows={4} />
        ) : filteredBills.length === 0 ? (
          <EmptyState icon={DollarSign} title="No bills found" description={filter === 'all' ? "No bills have been generated yet." : `No ${filter.toLowerCase()} bills.`} />
        ) : (
          <div className="space-y-3">
            {filteredBills.map((bill) => (
              <Link key={bill.id} to={`/receipt/${bill.id}`} className="card-hover p-5 block">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-surface-900 truncate">{bill.title}</h3>
                      <span className={STATUS_BADGES[bill.status]}>{bill.status}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-surface-500">
                      <span>Period: <span className="font-medium text-surface-700">{bill.billing_period}</span></span>
                      <span>Due: <span className="font-medium text-surface-700">{new Date(bill.due_date).toLocaleDateString()}</span></span>
                      {bill.paid_at && <span>Paid: <span className="font-medium text-success">{new Date(bill.paid_at).toLocaleDateString()}</span></span>}
                      {bill.payment_method && <span>Via: <span className="font-medium text-surface-700">{bill.payment_method}</span></span>}
                    </div>
                    {bill.description && <p className="text-sm text-surface-500 mt-2 line-clamp-1">{bill.description}</p>}
                  </div>
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2 flex-shrink-0">
                    <p className="text-xl font-bold text-surface-900">₹{bill.amount.toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                      {bill.receipt_number && (
                        <span className="badge-purple text-[10px]">{bill.receipt_number}</span>
                      )}
                      <ArrowRight size={16} className="text-surface-300" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
