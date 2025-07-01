import React from "react";

// Utility: Calculate business days between two dates (exclude weekends)
function calculateBusinessDays(startStr?: string, endStr?: string): string | number {
  if (!startStr || !endStr) return "";
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return "";
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++; // Mon-Fri only
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// Filtering helper
function filterItemsByMode(
  items: ChangeItem[],
  filterMode: string,
  selectedYear: string,
  selectedMonth: string,
  selectedDay: string,
  selectedQuarter: string,
  selectedWeekOfMonth: number | null,
  selectedWeekOfYear: number | null,
  fromDay: string,
  fromMonth: string,
  fromYear: string,
  toDay: string,
  toMonth: string,
  toYear: string
) {
  return items.filter((item) => {
    const y = item.processyear || "";
    const m = item.processmonth || "";
    const d = item.processday || "";

    switch (filterMode) {
      case "year":
        return y === selectedYear;
      case "month":
        return y === selectedYear && m === selectedMonth;
      case "quarter": {
        if (y !== selectedYear) return false;
        const monthNum = parseInt(m, 10);
        const q = parseInt(selectedQuarter, 10);
        if (isNaN(monthNum) || isNaN(q)) return false;
        const quarterRanges: Record<number, [number, number]> = {
          1: [1, 3],
          2: [4, 6],
          3: [7, 9],
          4: [10, 12],
        };
        const [minMonth, maxMonth] = quarterRanges[q];
        return monthNum >= minMonth && monthNum <= maxMonth;
      }
      case "day":
        return y === selectedYear && m === selectedMonth && d === selectedDay;
      case "weekOfMonth": {
        if (y !== selectedYear || m !== selectedMonth) return false;
        if (!selectedWeekOfMonth) return true;
        const dayNum = parseInt(d, 10);
        if (isNaN(dayNum)) return false;
        const itemWeek = Math.ceil(dayNum / 7);
        return itemWeek === selectedWeekOfMonth;
      }
      case "weekOfYear": {
        if (!selectedWeekOfYear) return true;
        try {
          const itemDate = new Date(+y, +m - 1, +d);
          if (itemDate.getFullYear() !== Number(selectedYear)) return false;
          const getWeekNum = (dt: Date) => {
            const startOfYear = new Date(dt.getFullYear(), 0, 1);
            const diffDays =
              (dt.getTime() - startOfYear.getTime()) / (1000 * 3600 * 24);
            return Math.floor(diffDays / 7) + 1;
          };
          const w = getWeekNum(itemDate);
          return w === selectedWeekOfYear;
        } catch {
          return false;
        }
      }
      case "customRange": {
        try {
          const itemDate = new Date(+y, +m - 1, +d);
          const fromDate = new Date(+fromYear, +fromMonth - 1, +fromDay);
          const toDate = new Date(+toYear, +toMonth - 1, +toDay);
          return itemDate >= fromDate && itemDate <= toDate;
        } catch {
          return false;
        }
      }
      default:
        return true;
    }
  });
}

export interface ChangeItem {
  ID: string;
  Project?: string;
  SheetName?: string;
  Processnumber?: string;
  OEMOfferChangenumber?: string;
  StartdatePAVPhase4?: string;
  EnddatePAVPhase4?: string;
  processyear?: string;
  processmonth?: string;
  processday?: string;
}

export interface ClosurePhase4TableProps {
  items: ChangeItem[];
  filterMode: string;
  selectedYear: string;
  selectedMonth: string;
  selectedDay: string;
  selectedQuarter: string;
  selectedWeekOfMonth: number | null;
  selectedWeekOfYear: number | null;
  fromDay: string;
  fromMonth: string;
  fromYear: string;
  toDay: string;
  toMonth: string;
  toYear: string;
}

const ClosurePhase4Table: React.FC<ClosurePhase4TableProps> = ({
  items,
  filterMode,
  selectedYear,
  selectedMonth,
  selectedDay,
  selectedQuarter,
  selectedWeekOfMonth,
  selectedWeekOfYear,
  fromDay,
  fromMonth,
  fromYear,
  toDay,
  toMonth,
  toYear,
}) => {
  // 1. Filter items using the dashboard's logic
  const filteredItems = filterItemsByMode(
    items,
    filterMode,
    selectedYear,
    selectedMonth,
    selectedDay,
    selectedQuarter,
    selectedWeekOfMonth,
    selectedWeekOfYear,
    fromDay,
    fromMonth,
    fromYear,
    toDay,
    toMonth,
    toYear
  );

  // 2. Group by project (use Project or SheetName)
  const grouped: Record<string, ChangeItem[]> = {};
  filteredItems.forEach((item) => {
    const project = item.Project || item.SheetName || "Unknown Project";
    if (!grouped[project]) grouped[project] = [];
    grouped[project].push(item);
  });

  return (
    <div>
      {Object.entries(grouped).map(([project, rows]) => (
        <div key={project} style={{ marginBottom: 40 }}>
          <h2 className="text-lg font-bold mb-3">{project}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 rounded">
              <thead>
                <tr className="bg-blue-800 text-white">
                  <th className="px-3 py-2 border">Change ID</th>
                  <th className="px-3 py-2 border">OEM Offer Change</th>
                  <th className="px-3 py-2 border">Start date PaV phase4</th>
                  <th className="px-3 py-2 border">End date PaV phase4</th>
                  <th className="px-3 py-2 border">Nbr of days</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.ID} className="bg-gray-100">
                    <td className="px-3 py-2 border text-center">{item.Processnumber || ""}</td>
                    <td className="px-3 py-2 border text-center">{item.OEMOfferChangenumber || ""}</td>
                    <td className="px-3 py-2 border text-center">
                      {item.StartdatePAVPhase4
                        ? new Date(item.StartdatePAVPhase4).toLocaleDateString()
                        : ""}
                    </td>
                    <td className="px-3 py-2 border text-center">
                      {item.EnddatePAVPhase4
                        ? new Date(item.EnddatePAVPhase4).toLocaleDateString()
                        : ""}
                    </td>
                    <td className="px-3 py-2 border text-center">
                      {calculateBusinessDays(
                        item.StartdatePAVPhase4,
                        item.EnddatePAVPhase4
                      )}
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-center text-gray-500">
                      No data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      {!Object.keys(grouped).length && (
        <div className="text-gray-500 text-center">No data for selected period.</div>
      )}
    </div>
  );
};

export default ClosurePhase4Table;
