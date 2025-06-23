// src/components/dashboard/StatsCards.tsx
import React from "react";

import autarkeImg from "../../assets/images/autarke.png";
import innenraumImg from "../../assets/images/innenraum.png";
import cockpitImg from "../../assets/images/cockpit.png";
import mrImg from "../../assets/images/mr.png";

export interface StatsCardsProps {
  totalChanges: number;
  changesByArea: Record<string, number>;
}

const imageForArea = (area: string): string | null => {
  switch (area) {
    case "Innenraum":
      return innenraumImg;
    case "Autarke":
      return autarkeImg;
    case "Cockpit":
      return cockpitImg;
    case "MR":
      return mrImg;
    default:
      return null; // fallback
  }
};

export default function StatsCards({ totalChanges, changesByArea }: StatsCardsProps) {
  return (
    <div className="space-y-6">
      {/* Total Changes */}
      <div className="text-center">
        <div className="text-lg text-gray-700">Total Changes</div>
        <div className="text-3xl font-bold text-blue-700">{totalChanges}</div>
      </div>

      {/* Area Cards */}
      <div className="flex flex-wrap justify-center gap-6">
        {Object.entries(changesByArea).map(([area, count]) => {
          const imageSrc = imageForArea(area);

          return (
            <div
              key={area}
              className="w-48 bg-white p-4 rounded-lg shadow-md flex flex-col items-center"
            >
              <div className="text-2xl font-bold text-blue-600">{count}</div>
              <div className="text-sm text-gray-700 mt-1 text-center">{area}</div>
              {imageSrc && (
                <div className="w-full h-40 overflow-hidden rounded">
  <img
    src={imageSrc}
    alt={area}
    className="w-full h-full object-cover"
  />
</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
