// This is the simplified version with integrated dynamic filter controls
// Place this inside your `ChangesDashboard` component file

import React from "react";

interface FilterControlsProps {
  filterMode: string;
  setFilterMode: (mode: any) => void;
  selectedYear: string;
  setSelectedYear: (val: string) => void;
  selectedMonth: string;
  setSelectedMonth: (val: string) => void;
  selectedQuarter: string;
  setSelectedQuarter: (val: string) => void;
  selectedDay: string;
  setSelectedDay: (val: string) => void;
  selectedWeekOfMonth: number | null;
  setSelectedWeekOfMonth: (val: number | null) => void;
  selectedWeekOfYear: number | null;
  setSelectedWeekOfYear: (val: number | null) => void;
  fromDay: string;
  fromMonth: string;
  fromYear: string;
  toDay: string;
  toMonth: string;
  toYear: string;
  setFromDay: (v: string) => void;
  setFromMonth: (v: string) => void;
  setFromYear: (v: string) => void;
  setToDay: (v: string) => void;
  setToMonth: (v: string) => void;
  setToYear: (v: string) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  filterMode,
  setFilterMode,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedQuarter,
  setSelectedQuarter,
  selectedDay,
  setSelectedDay,
  selectedWeekOfMonth,
  setSelectedWeekOfMonth,
  selectedWeekOfYear,
  setSelectedWeekOfYear,
  fromDay,
  fromMonth,
  fromYear,
  toDay,
  toMonth,
  toYear,
  setFromDay,
  setFromMonth,
  setFromYear,
  setToDay,
  setToMonth,
  setToYear,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <label className="text-sm font-medium">Filter Mode:</label>
        <select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="month">Month</option>
          <option value="year">Year</option>
          <option value="quarter">Quarter</option>
          <option value="day">Day</option>
          <option value="weekOfMonth">Week of Month</option>
          <option value="weekOfYear">Week of Year</option>
          <option value="customRange">Custom Range</option>
        </select>
      </div>

      {(filterMode === "month" || filterMode === "weekOfMonth") && (
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="p-2 border rounded"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>
      )}

      {(filterMode === "year" || filterMode === "quarter" || filterMode === "weekOfYear") && (
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="p-2 border rounded"
        >
          {Array.from({ length: 6 }).map((_, i) => {
            const yearOpt = 2024 + i;
            return (
              <option key={yearOpt} value={String(yearOpt)}>
                {yearOpt}
              </option>
            );
          })}
        </select>
      )}

      {filterMode === "quarter" && (
        <select
          value={selectedQuarter}
          onChange={(e) => setSelectedQuarter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="1">Q1</option>
          <option value="2">Q2</option>
          <option value="3">Q3</option>
          <option value="4">Q4</option>
        </select>
      )}

      {filterMode === "day" && (
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          className="p-2 border rounded"
        >
          {Array.from({ length: 31 }, (_, i) => (
            <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
              {i + 1}
            </option>
          ))}
        </select>
      )}

      {filterMode === "weekOfMonth" && (
        <select
          value={selectedWeekOfMonth ?? ""}
          onChange={(e) => setSelectedWeekOfMonth(Number(e.target.value))}
          className="p-2 border rounded"
        >
          {[1, 2, 3, 4, 5].map((w) => (
            <option key={w} value={w}>Week {w}</option>
          ))}
        </select>
      )}

      {filterMode === "weekOfYear" && (
        <select
          value={selectedWeekOfYear ?? ""}
          onChange={(e) => setSelectedWeekOfYear(Number(e.target.value))}
          className="p-2 border rounded"
        >
          {[...Array(53)].map((_, i) => (
            <option key={i + 1} value={i + 1}>Week {i + 1}</option>
          ))}
        </select>
      )}

      {filterMode === "customRange" && (
        <div className="flex gap-2 flex-wrap">
          <input
            type="date"
            value={`${fromYear}-${fromMonth}-${fromDay}`}
            onChange={(e) => {
              const [y, m, d] = e.target.value.split("-");
              setFromYear(y);
              setFromMonth(m);
              setFromDay(d);
            }}
            className="p-2 border rounded"
          />
          <input
            type="date"
            value={`${toYear}-${toMonth}-${toDay}`}
            onChange={(e) => {
              const [y, m, d] = e.target.value.split("-");
              setToYear(y);
              setToMonth(m);
              setToDay(d);
            }}
            className="p-2 border rounded"
          />
        </div>
      )}
    </div>
  );
};

export default FilterControls;
