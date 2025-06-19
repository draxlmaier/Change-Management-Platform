import React from "react";

interface FollowCostItem {
  Area: string;
  Followupcost_x002f_BudgetPA: number;
  InitiationReasons: string;
  BucketResponsible: string;
}

interface Props {
  data: FollowCostItem[];
}

export const FollowupCostAreaCards: React.FC<Props> = ({ data }) => {
  const grouped = new Map<string, FollowCostItem[]>();
  data.forEach((item) => {
    if (!item.Area || isNaN(item.Followupcost_x002f_BudgetPA)) return;
    if (!grouped.has(item.Area)) grouped.set(item.Area, []);
    grouped.get(item.Area)?.push(item);
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...grouped.entries()].map(([area, items]) => {
        const avg =
          items.reduce((sum, i) => sum + i.Followupcost_x002f_BudgetPA, 0) /
          items.length;

        const initCount: Record<string, number> = {};
        const bucketCount: Record<string, number> = {};
        items.forEach((i) => {
          initCount[i.InitiationReasons] = (initCount[i.InitiationReasons] || 0) + 1;
          bucketCount[i.BucketResponsible] = (bucketCount[i.BucketResponsible] || 0) + 1;
        });
        const initTotal = Object.values(initCount).reduce((a, b) => a + b, 0);
        const bucketTotal = Object.values(bucketCount).reduce((a, b) => a + b, 0);

        return (
          <div key={area} className="bg-white p-4 rounded shadow-md">
            <h3 className="text-lg font-semibold mb-2">Area: {area}</h3>
            <p className="text-blue-600 text-xl font-bold mb-2">
              Avg Cost / Budget: {avg.toFixed(2)}
            </p>
            <div className="text-sm text-gray-600 mb-1 font-medium">Initiation Reasons:</div>
            {Object.entries(initCount).map(([key, val]) => (
              <p key={key} className="text-sm">
                • {key}: {((val / initTotal) * 100).toFixed(1)}%
              </p>
            ))}
            <div className="text-sm text-gray-600 mt-2 mb-1 font-medium">Bucket Responsible:</div>
            {Object.entries(bucketCount).map(([key, val]) => (
              <p key={key} className="text-sm">
                • {key}: {((val / bucketTotal) * 100).toFixed(1)}%
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
};
