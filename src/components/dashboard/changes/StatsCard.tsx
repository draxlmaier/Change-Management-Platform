// File: src/components/dashboard/StatsCard.tsx
import React from 'react';

export interface Stat {
  label: string;
  value: number;
}

export default function StatsCard({ label, value }: Stat) {
  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
