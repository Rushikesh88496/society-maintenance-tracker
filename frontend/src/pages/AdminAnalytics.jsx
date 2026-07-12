import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Download,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import Layout from '../components/Layout';
import { SkeletonCard } from '../components/Skeletons';
import BarChartComponent from '../components/charts/BarChart';
import PieChartComponent from '../components/charts/PieChart';
import LineChartComponent from '../components/charts/LineChart';

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [category, setCategory] = useState([]);
  const [priority, setPriority] = useState([]);
  const [resolution, setResolution] = useState(null);
  const [growth, setGrowth] = useState([]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sumRes, monthRes, catRes, priRes, resRes, growRes] = await Promise.all([
        axios.get('/api/analytics/summary'),
        axios.get('/api/analytics/monthly-complaints'),
        axios.get('/api/analytics/category-breakdown'),
        axios.get('/api/analytics/priority-breakdown'),
        axios.get('/api/analytics/resolution-time'),
        axios.get('/api/analytics/resident-growth'),
      ]);
      setSummary(sumRes.data);
      setMonthly(monthRes.data);
      setCategory(catRes.data);
      setPriority(priRes.data);
      setResolution(resRes.data);
      setGrowth(growRes.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = useCallback(() => {
    setExporting('csv');
    try {
      const rows = [
        ['Metric', 'Value'],
        ['Total Complaints', summary.totalComplaints],
        ['Open Complaints', summary.openComplaints],
        ['Resolved Complaints', summary.resolvedComplaints],
        ['Resolution Rate', `${summary.resolutionRate}%`],
        ['Total Residents', summary.totalResidents],
        ['Active Staff', summary.totalStaff],
        ['Total Bills', summary.totalBills],
        ['Total Billed Amount', `₹${summary.totalBilledAmount}`],
        ['Total Collected', `₹${summary.totalCollected}`],
        ['Total Visitors', summary.totalVisitors],
        [],
        ['--- Monthly Complaints ---'],
        ['Month', 'Complaints', 'Resolved'],
        ...monthly.map(m => [m.label, m.complaints, m.resolved]),
        [],
        ['--- Category Breakdown ---'],
        ['Category', 'Total', 'Resolved', 'Open'],
        ...category.map(c => [c.category, c.count, c.resolved, c.open]),
        [],
        ['--- Priority ---'],
        ['Priority', 'Count', 'Avg Hours'],
        ...priority.map(p => [p.priority, p.count, p.avg_hours]),
      ];
      if (resolution?.overall) {
        rows.push([]);
        rows.push(['--- Resolution Time ---']);
        rows.push(['Avg Days', 'Min Days', 'Max Days']);
        rows.push([resolution.overall.avg_days, resolution.overall.min_days, resolution.overall.max_days]);
      }
      const csv = rows.map(r => r.join(',')).join('\n');
      downloadFile(csv, 'analytics-report.csv', 'text/csv');
    } finally { setExporting(null); }
  }, [summary, monthly, category, priority, resolution]);

  const handleExportExcel = useCallback(() => {
    setExporting('excel');
    import('xlsx').then((XLSX) => {
      const wb = XLSX.utils.book_new();

      const summaryData = [
        ['Metric', 'Value'],
        ['Total Complaints', summary.totalComplaints],
        ['Open Complaints', summary.openComplaints],
        ['Resolved Complaints', summary.resolvedComplaints],
        ['Resolution Rate', `${summary.resolutionRate}%`],
        ['Total Residents', summary.totalResidents],
        ['Active Staff', summary.totalStaff],
        ['Total Bills', summary.totalBills],
        ['Total Billed (₹)', summary.totalBilledAmount],
        ['Collected (₹)', summary.totalCollected],
        ['Total Visitors', summary.totalVisitors],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary');

      const monthData = [['Month', 'Complaints', 'Resolved']];
      monthly.forEach(m => monthData.push([m.label, m.complaints, m.resolved]));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(monthData), 'Monthly');

      const catData = [['Category', 'Total', 'Resolved', 'Open']];
      category.forEach(c => catData.push([c.category, c.count, c.resolved, c.open]));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(catData), 'Categories');

      const priData = [['Priority', 'Count', 'Avg Hours']];
      priority.forEach(p => priData.push([p.priority, p.count, p.avg_hours]));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(priData), 'Priority');

      if (resolution?.overall) {
        const resData = [['Avg Days', 'Min Days', 'Max Days', 'Resolved Count'],
          [resolution.overall.avg_days, resolution.overall.min_days, resolution.overall.max_days, resolution.overall.resolved_count]];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resData), 'Resolution');
      }

      if (growth.length) {
        const gData = [['Month', 'New Residents', 'Total']];
        growth.forEach(g => gData.push([g.label, g.newResidents, g.totalResidents]));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(gData), 'Growth');
      }

      XLSX.writeFile(wb, 'analytics-report.xlsx');
      setExporting(null);
    });
  }, [summary, monthly, category, priority, resolution, growth]);

  const handleExportPDF = useCallback(() => {
    setExporting('pdf');
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF();
        let y = 20;

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Analytics Report', 105, y, { align: 'center' });
        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 105, y, { align: 'center' });
        y += 12;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text('Summary', 14, y);
        y += 2;

        doc.autoTable({
          startY: y,
          head: [['Metric', 'Value']],
          body: [
            ['Total Complaints', summary.totalComplaints],
            ['Open Complaints', summary.openComplaints],
            ['Resolved Complaints', summary.resolvedComplaints],
            ['Resolution Rate', `${summary.resolutionRate}%`],
            ['Total Residents', summary.totalResidents],
            ['Active Staff', summary.totalStaff],
            ['Total Bills', summary.totalBills],
            ['Total Billed', `₹${summary.totalBilledAmount.toLocaleString()}`],
            ['Collected', `₹${summary.totalCollected.toLocaleString()}`],
            ['Total Visitors', summary.totalVisitors],
          ],
          theme: 'grid',
          headStyles: { fillColor: [37, 99, 235] },
          styles: { fontSize: 9 },
        });
        y = doc.lastAutoTable.finalY + 10;

        if (monthly.length) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Monthly Complaints', 14, y);
          y += 2;
          doc.autoTable({
            startY: y,
            head: [['Month', 'Complaints', 'Resolved']],
            body: monthly.map(m => [m.label, m.complaints, m.resolved]),
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] },
            styles: { fontSize: 9 },
          });
          y = doc.lastAutoTable.finalY + 10;
        }

        if (category.length && y < 240) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Category Breakdown', 14, y);
          y += 2;
          doc.autoTable({
            startY: y,
            head: [['Category', 'Total', 'Resolved', 'Open']],
            body: category.map(c => [c.category, c.count, c.resolved, c.open]),
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] },
            styles: { fontSize: 9 },
          });
          y = doc.lastAutoTable.finalY + 10;
        }

        if (priority.length && y < 240) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Priority Breakdown', 14, y);
          y += 2;
          doc.autoTable({
            startY: y,
            head: [['Priority', 'Count', 'Avg Hours to Resolve']],
            body: priority.map(p => [p.priority, p.count, p.avg_hours]),
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] },
            styles: { fontSize: 9 },
          });
        }

        if (resolution?.overall?.avg_days) {
          if (y > 200) { doc.addPage(); y = 20; }
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Resolution Time', 14, y);
          y += 2;
          doc.autoTable({
            startY: y,
            head: [['Avg Days', 'Min Days', 'Max Days', 'Resolved']],
            body: [[resolution.overall.avg_days, resolution.overall.min_days, resolution.overall.max_days, resolution.overall.resolved_count]],
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] },
            styles: { fontSize: 9 },
          });
        }

        doc.save('analytics-report.pdf');
        setExporting(null);
      });
    });
  }, [summary, monthly, category, priority, resolution]);

  const PRIORITY_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8" id="analytics-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-display-lg text-surface-900">Analytics</h1>
            <p className="text-surface-500 mt-1">Comprehensive insights into society operations</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchAll} className="btn-secondary btn-sm" disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={handleExportCSV} disabled={loading || !summary} className="btn-secondary btn-sm">
              <Download size={14} /> CSV
            </button>
            <button onClick={handleExportExcel} disabled={loading || !summary} className="btn-secondary btn-sm">
              <FileSpreadsheet size={14} /> Excel
            </button>
            <button onClick={handleExportPDF} disabled={loading || !summary} className="btn-brand btn-sm">
              <FileText size={14} /> PDF
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : summary && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Complaints', value: summary.totalComplaints, icon: AlertCircle, color: 'text-brand-600', bg: 'bg-brand-100' },
              { label: 'Resolution Rate', value: `${summary.resolutionRate}%`, icon: CheckCircle, color: 'text-success', bg: 'bg-success-50' },
              { label: 'Active Residents', value: summary.totalResidents, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
              { label: 'Collection', value: `₹${summary.totalCollected.toLocaleString()}`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100' },
              { label: 'Total Visitors', value: summary.totalVisitors, icon: UserPlus, color: 'text-cyan-600', bg: 'bg-cyan-100' },
            ].map(card => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="card-hover p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                      <Icon size={20} className={card.color} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-surface-500">{card.label}</p>
                      <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Complaints Trend */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-brand-600" />
              <h2 className="text-display-sm text-surface-900">Monthly Complaints</h2>
            </div>
            <BarChartComponent data={monthly} xKey="label" height={300}
              bars={[
                { key: 'complaints', name: 'Filed', color: '#2563eb', barSize: 18 },
                { key: 'resolved', name: 'Resolved', color: '#10b981', barSize: 18 },
              ]} />
          </div>

          {/* Category Breakdown */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieIcon size={18} className="text-purple-600" />
              <h2 className="text-display-sm text-surface-900">Category Distribution</h2>
            </div>
            <PieChartComponent data={category} dataKey="count" nameKey="category" height={300} />
          </div>

          {/* Priority Breakdown */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={18} className="text-amber-600" />
              <h2 className="text-display-sm text-surface-900">Priority Breakdown</h2>
            </div>
            <div className="space-y-4">
              {priority.map(p => {
                const total = priority.reduce((s, pr) => s + pr.count, 0);
                const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
                return (
                  <div key={p.priority}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[p.priority] || '#94a3b8' }} />
                        <span className="text-sm font-medium text-surface-700">{p.priority}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-surface-900">{p.count}</span>
                        <span className="text-xs text-surface-400 w-10 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-surface-100 rounded-full h-2.5">
                      <div className="h-2.5 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: PRIORITY_COLORS[p.priority] || '#94a3b8' }} />
                    </div>
                    {p.avg_hours && (
                      <p className="text-xs text-surface-400 mt-1">Avg resolve: {p.avg_hours}h</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resolution Time */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-cyan-600" />
              <h2 className="text-display-sm text-surface-900">Resolution Time</h2>
            </div>
            {resolution?.overall ? (
              <>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: 'Average', value: `${resolution.overall.avg_days || 0}d`, color: 'text-brand-600' },
                    { label: 'Fastest', value: `${resolution.overall.min_days || 0}d`, color: 'text-success' },
                    { label: 'Slowest', value: `${resolution.overall.max_days || 0}d`, color: 'text-danger' },
                  ].map(item => (
                    <div key={item.label} className="p-3 bg-surface-50 rounded-xl text-center">
                      <p className="text-xs font-medium text-surface-500">{item.label}</p>
                      <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
                {resolution.monthly.length > 0 && (
                  <LineChartComponent data={resolution.monthly} xKey="label" height={180}
                    lines={[{ key: 'avgDays', name: 'Avg Days', color: '#06b6d4' }]} />
                )}
              </>
            ) : (
              <div className="text-center py-8 text-sm text-surface-400">No resolved complaints yet</div>
            )}
          </div>
        </div>

        {/* Resident Growth - full width */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-success" />
            <h2 className="text-display-sm text-surface-900">Resident Growth</h2>
          </div>
          {growth.length > 0 ? (
            <LineChartComponent data={growth} xKey="label" height={300}
              lines={[
                { key: 'newResidents', name: 'New Residents', color: '#8b5cf6' },
                { key: 'totalResidents', name: 'Total Residents', color: '#10b981' },
              ]} />
          ) : (
            <div className="text-center py-8 text-sm text-surface-400">No resident data yet</div>
          )}
        </div>

        {/* Category by Status - full width */}
        {category.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-indigo-600" />
              <h2 className="text-display-sm text-surface-900">Category by Status</h2>
            </div>
            <BarChartComponent data={category} xKey="category" layout="vertical" height={Math.max(200, category.length * 40)}
              bars={[
                { key: 'resolved', name: 'Resolved', color: '#10b981', barSize: 14 },
                { key: 'open', name: 'Open', color: '#f59e0b', barSize: 14 },
              ]} />
          </div>
        )}
      </div>
    </Layout>
  );
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
