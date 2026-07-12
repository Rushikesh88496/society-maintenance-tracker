import React, { memo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#2563eb', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-surface-200 rounded-lg shadow-lg px-4 py-3">
      <p className="text-sm font-semibold" style={{ color: payload[0].payload.fill || payload[0].color }}>
        {payload[0].name}: {payload[0].value}
      </p>
      {payload[0].payload.percent !== undefined && (
        <p className="text-xs text-surface-500">{(payload[0].payload.percent * 100).toFixed(1)}%</p>
      )}
    </div>
  );
};

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

function PieChartComponent({ data, dataKey = 'count', nameKey = 'category', height = 300, innerRadius = 0, showLabel = true }) {
  if (!data?.length) return <div className="flex items-center justify-center h-48 text-sm text-surface-400">No data available</div>;

  const total = data.reduce((sum, d) => sum + d[dataKey], 0);
  const chartData = data.map((d, i) => ({
    ...d,
    name: d[nameKey],
    fill: COLORS[i % COLORS.length],
    percent: total > 0 ? d[dataKey] / total : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" dataKey={dataKey} nameKey="name"
          innerRadius={innerRadius} outerRadius={Math.min(height * 0.38, 120)}
          paddingAngle={data.length > 1 ? 2 : 0} labelLine={false}
          label={showLabel ? renderCustomizedLabel : false}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} stroke="white" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="bottom" height={36}
          formatter={(value, entry) => <span className="text-xs text-surface-600">{value}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default memo(PieChartComponent);
