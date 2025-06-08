// File: src/components/dashboard/StatsCards.tsx
import React from 'react';

export interface StatsCardsProps {
  totalChanges: number;
  changesByArea: Record<string, number>;
}

export default function StatsCards({ totalChanges, changesByArea }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Total Changes */}
      <div className="p-4 bg-white rounded shadow">
        <div className="text-sm text-gray-500">Total Changes</div>
        <div className="text-2xl font-bold">{totalChanges}</div>
      </div>
      {/* One card per area */}
      {Object.entries(changesByArea).map(([area, count]) => (
        <div key={area} className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">{area}</div>
          <div className="text-2xl font-bold">{count}</div>
        </div>
      ))}
    </div>
  );
}
