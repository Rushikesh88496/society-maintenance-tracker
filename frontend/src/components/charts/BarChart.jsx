import React, { memo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
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

function BarChartComponent({ data, bars, xKey = 'label', height = 300, layout = 'vertical' }) {
  if (!data?.length) return <div className="flex items-center justify-center h-48 text-sm text-surface-400">No data available</div>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout === 'vertical' ? 'vertical' : 'horizontal'}
        margin={{ top: 5, right: 20, left: layout === 'vertical' ? 60 : 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        {layout === 'vertical' ? (
          <>
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey={xKey} tick={{ fontSize: 11 }} width={70} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} />
          </>
        )}
        <Tooltip content={<CustomTooltip />} />
        {bars.map((bar) => (
          <Bar key={bar.key} dataKey={bar.key} name={bar.name || bar.key}
            fill={bar.color || '#2563eb'} radius={[0, 4, 4, 0]} barSize={bar.barSize || 20} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export default memo(BarChartComponent);
