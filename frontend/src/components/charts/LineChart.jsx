import React, { memo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-surface-200 rounded-lg shadow-lg px-4 py-3">
      <p className="text-xs font-semibold text-surface-500 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

function LineChartComponent({ data, lines, xKey = 'label', height = 300 }) {
  if (!data?.length) return <div className="flex items-center justify-center h-48 text-sm text-surface-400">No data available</div>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="bottom" height={36}
          formatter={(value) => <span className="text-xs text-surface-600">{value}</span>} />
        {lines.map((line) => (
          <Line key={line.key} type="monotone" dataKey={line.key} name={line.name || line.key}
            stroke={line.color || '#2563eb'} strokeWidth={2} dot={{ r: 3, fill: line.color || '#2563eb' }}
            activeDot={{ r: 5 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export default memo(LineChartComponent);
