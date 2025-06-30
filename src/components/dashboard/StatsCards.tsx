import React from "react";
import { AreaImage } from "../../pages/types";

export interface StatsCardsProps {
  totalChanges: number;
  changesByArea: Record<string, number>;
  areaImages: AreaImage[];
}

// Returns latest uploaded image for an area, or undefined
const getUploadedAreaImage = (area: string, areaImages: AreaImage[]): string | undefined => {
  const images = areaImages
    .filter(img => img.area === area)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return images.length ? images[0].imageData : undefined;
};

export default function StatsCards({ totalChanges, changesByArea, areaImages }: StatsCardsProps) {
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
          const uploadedImgSrc = getUploadedAreaImage(area, areaImages);

          return (
            <div
              key={area}
              className="w-48 bg-white p-4 rounded-lg shadow-md flex flex-col items-center"
            >
              <div className="text-2xl font-bold text-blue-600">{count}</div>
              <div className="text-sm text-gray-700 mt-1 text-center">{area}</div>
              {uploadedImgSrc ? (
                <div className="w-full h-40 overflow-hidden rounded">
                  <img
                    src={uploadedImgSrc}
                    alt={area}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-40" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
