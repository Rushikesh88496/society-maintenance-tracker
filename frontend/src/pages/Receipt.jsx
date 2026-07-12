import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ChevronLeft,
  Download,
  Printer,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import Layout from '../components/Layout';
import { SkeletonDetail } from '../components/Skeletons';

export default function ReceiptPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef();

  useEffect(() => {
    fetchBill();
  }, [id]);

  const fetchBill = async () => {
    try {
      const res = await axios.get(`/api/bills/${id}`);
      setBill(res.data);
    } catch (err) {
      console.error('Error fetching bill:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(getReceiptHTML(bill));
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    const blob = new Blob([getReceiptHTML(bill)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${bill.receipt_number || bill.id.slice(0, 8)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto"><SkeletonDetail /></div>
      </Layout>
    );
  }

  if (!bill) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="btn-ghost mb-6"><ChevronLeft size={16} /> Back</button>
          <div className="card p-12 text-center">
            <AlertCircle size={40} className="mx-auto text-surface-300 mb-4" />
            <h2 className="text-lg font-semibold text-surface-900">Bill Not Found</h2>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="btn-ghost -ml-2"><ChevronLeft size={16} /> Back</button>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="btn-secondary btn-sm"><Printer size={14} /> Print</button>
            <button onClick={handleDownload} className="btn-brand btn-sm"><Download size={14} /> Download</button>
          </div>
        </div>

        {/* Receipt Card */}
        <div ref={receiptRef} className="card p-8">
          {/* Header */}
          <div className="text-center pb-6 border-b border-surface-200">
            <div className="w-14 h-14 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-lg">ST</span>
            </div>
            <h1 className="text-xl font-bold text-surface-900">Society Maintenance Tracker</h1>
            <p className="text-sm text-surface-500">Maintenance Bill / Receipt</p>
          </div>

          {/* Status Banner */}
          <div className={`my-6 p-4 rounded-xl text-center ${
            bill.status === 'Paid' ? 'bg-success-50 border border-success-100' :
            bill.status === 'Overdue' ? 'bg-danger-50 border border-danger-100' :
            'bg-amber-50 border border-amber-100'
          }`}>
            <div className="flex items-center justify-center gap-2">
              {bill.status === 'Paid' ? <CheckCircle size={20} className="text-success" /> : <Clock size={20} className="text-amber-600" />}
              <span className={`text-lg font-bold ${
                bill.status === 'Paid' ? 'text-success-700' :
                bill.status === 'Overdue' ? 'text-danger' : 'text-amber-700'
              }`}>
                {bill.status === 'Paid' ? 'PAID' : bill.status === 'Overdue' ? 'OVERDUE' : 'PENDING'}
              </span>
            </div>
            {bill.receipt_number && (
              <p className="text-xs text-surface-500 mt-1 font-mono">Receipt: {bill.receipt_number}</p>
            )}
          </div>

          {/* Bill Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-surface-100">
              <span className="text-sm text-surface-500">Bill Title</span>
              <span className="text-sm font-semibold text-surface-900">{bill.title}</span>
            </div>
            {bill.description && (
              <div className="flex items-center justify-between py-3 border-b border-surface-100">
                <span className="text-sm text-surface-500">Description</span>
                <span className="text-sm text-surface-700">{bill.description}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-3 border-b border-surface-100">
              <span className="text-sm text-surface-500">Resident</span>
              <div className="text-right">
                <p className="text-sm font-semibold text-surface-900">{bill.resident_name}</p>
                {bill.apartment_number && <p className="text-xs text-surface-500">Apt: {bill.apartment_number}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-surface-100">
              <span className="text-sm text-surface-500">Billing Period</span>
              <span className="text-sm font-semibold text-surface-900">{bill.billing_period}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-surface-100">
              <span className="text-sm text-surface-500">Due Date</span>
              <span className="text-sm font-semibold text-surface-900">{new Date(bill.due_date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-surface-100">
              <span className="text-sm text-surface-500">Generated On</span>
              <span className="text-sm text-surface-700">{new Date(bill.created_at).toLocaleDateString()}</span>
            </div>

            {bill.status === 'Paid' && (
              <>
                <div className="flex items-center justify-between py-3 border-b border-surface-100">
                  <span className="text-sm text-surface-500">Payment Method</span>
                  <span className="text-sm font-semibold text-surface-900">{bill.payment_method}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-surface-100">
                  <span className="text-sm text-surface-500">Paid On</span>
                  <span className="text-sm font-semibold text-success-700">{bill.paid_at ? new Date(bill.paid_at).toLocaleString() : '---'}</span>
                </div>
              </>
            )}

            {/* Amount */}
            <div className="mt-6 p-5 bg-surface-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-surface-700">Amount</span>
                <span className="text-3xl font-bold text-surface-900">₹{bill.amount.toLocaleString()}</span>
              </div>
              {bill.status === 'Paid' && bill.paid_amount && bill.paid_amount !== bill.amount && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-surface-500">Amount Paid</span>
                  <span className="text-lg font-bold text-success">₹{bill.paid_amount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-surface-200 text-center">
            <p className="text-xs text-surface-400">Generated by Society Maintenance Tracker</p>
            <p className="text-xs text-surface-400 mt-1">This is a computer-generated receipt. No signature required.</p>
          </div>
        </div>

        {/* Payment History */}
        {bill.history && bill.history.length > 0 && (
          <div className="card p-6">
            <h2 className="text-display-sm text-surface-900 mb-4">Payment History</h2>
            <div className="space-y-3">
              {bill.history.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-surface-50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    entry.action === 'paid' ? 'bg-success-100 text-success' : 'bg-surface-200 text-surface-500'
                  }`}>
                    {entry.action === 'paid' ? <CheckCircle size={14} /> : <Clock size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-700 capitalize">{entry.action}</p>
                    <p className="text-xs text-surface-500">
                      By {entry.actor_name || 'System'} · {new Date(entry.timestamp).toLocaleString()}
                    </p>
                    {entry.note && <p className="text-xs text-surface-500 mt-1">{entry.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function getReceiptHTML(bill) {
  return `<!DOCTYPE html>
<html><head><title>Receipt - ${bill.receipt_number || bill.id.slice(0,8)}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; }
  .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
  .logo { width: 50px; height: 50px; background: #2563eb; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; }
  .status { text-align: center; padding: 12px; border-radius: 8px; margin: 16px 0; font-weight: bold; font-size: 18px; }
  .status.paid { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
  .status.pending { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
  .label { color: #64748b; font-size: 14px; }
  .value { font-weight: 600; font-size: 14px; }
  .total { background: #f8fafc; padding: 16px; border-radius: 8px; margin-top: 16px; }
  .total-row { display: flex; justify-content: space-between; }
  .total-amount { font-size: 28px; font-weight: bold; }
  .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 2px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
  @media print { body { padding: 0; } }
</style></head><body>
  <div class="header">
    <div class="logo">ST</div>
    <h1 style="margin:8px 0 4px">Society Maintenance Tracker</h1>
    <p style="color:#64748b;font-size:14px">Maintenance Bill / Receipt</p>
  </div>
  <div class="status ${bill.status === 'Paid' ? 'paid' : 'pending'}">
    ${bill.status === 'Paid' ? 'PAID' : bill.status === 'Overdue' ? 'OVERDUE' : 'PENDING'}
    ${bill.receipt_number ? `<div style="font-size:12px;font-weight:normal;margin-top:4px;font-family:monospace">Receipt: ${bill.receipt_number}</div>` : ''}
  </div>
  <div class="row"><span class="label">Bill Title</span><span class="value">${bill.title}</span></div>
  ${bill.description ? `<div class="row"><span class="label">Description</span><span class="value">${bill.description}</span></div>` : ''}
  <div class="row"><span class="label">Resident</span><span class="value">${bill.resident_name}${bill.apartment_number ? ` (${bill.apartment_number})` : ''}</span></div>
  <div class="row"><span class="label">Billing Period</span><span class="value">${bill.billing_period}</span></div>
  <div class="row"><span class="label">Due Date</span><span class="value">${new Date(bill.due_date).toLocaleDateString()}</span></div>
  <div class="row"><span class="label">Generated On</span><span class="value">${new Date(bill.created_at).toLocaleDateString()}</span></div>
  ${bill.status === 'Paid' ? `
  <div class="row"><span class="label">Payment Method</span><span class="value">${bill.payment_method}</span></div>
  <div class="row"><span class="label">Paid On</span><span class="value">${bill.paid_at ? new Date(bill.paid_at).toLocaleString() : '---'}</span></div>
  ` : ''}
  <div class="total">
    <div class="total-row">
      <span class="label" style="font-size:16px">Amount</span>
      <span class="total-amount">₹${bill.amount.toLocaleString()}</span>
    </div>
    ${bill.status === 'Paid' && bill.paid_amount && bill.paid_amount !== bill.amount ? `
    <div class="total-row" style="margin-top:8px">
      <span class="label">Amount Paid</span>
      <span class="value" style="color:#16a34a">₹${bill.paid_amount.toLocaleString()}</span>
    </div>` : ''}
  </div>
  <div class="footer">
    <p>Generated by Society Maintenance Tracker</p>
    <p style="margin-top:4px">This is a computer-generated receipt. No signature required.</p>
  </div>
</body></html>`;
}
