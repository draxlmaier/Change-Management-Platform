// src/components/dashboard/DashboardFilter.tsx

import React from "react";

type FilterMode = "year" | "month" | "week" | "day" | "customRange";

interface DashboardFilterProps {
  filterMode: FilterMode;
  setFilterMode: React.Dispatch<React.SetStateAction<FilterMode>>;

  // These are your *existing* single-date props for year/month/day:
  selectedYear: string;
  setSelectedYear: React.Dispatch<React.SetStateAction<string>>;
  selectedMonth: string;
  setSelectedMonth: React.Dispatch<React.SetStateAction<string>>;
  selectedDay: string;
  setSelectedDay: React.Dispatch<React.SetStateAction<string>>;

  // NEW: “From” and “To” date fields if using custom ranges:
  fromDay: string;
  setFromDay: React.Dispatch<React.SetStateAction<string>>;
  fromMonth: string;
  setFromMonth: React.Dispatch<React.SetStateAction<string>>;
  fromYear: string;
  setFromYear: React.Dispatch<React.SetStateAction<string>>;

  toDay: string;
  setToDay: React.Dispatch<React.SetStateAction<string>>;
  toMonth: string;
  setToMonth: React.Dispatch<React.SetStateAction<string>>;
  toYear: string;
  setToYear: React.Dispatch<React.SetStateAction<string>>;
}

export const DashboardFilter: React.FC<DashboardFilterProps> = ({
  filterMode,
  setFilterMode,

  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedDay,
  setSelectedDay,

  fromDay,
  setFromDay,
  fromMonth,
  setFromMonth,
  fromYear,
  setFromYear,
  toDay,
  setToDay,
  toMonth,
  setToMonth,
  toYear,
  setToYear
}) => {
  return (
    <div className="flex items-center space-x-4">
      {/* Filter Mode dropdown */}
      <div>
        <label className="mr-2">Filter Level:</label>
        <select
          value={filterMode}
          onChange={(e) =>
            setFilterMode(e.target.value as FilterMode)
          }
          className="p-2 border"
        >
          <option value="year">Year</option>
          <option value="month">Month</option>
          <option value="week">Week</option>
          <option value="day">Day</option>
          <option value="customRange">Custom Range</option>
        </select>
      </div>

      {/* Year */}
      {(filterMode !== "customRange") && (
        <>
          <div>
            <label className="mr-2">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="p-2 border"
            >
              {[2025, 2026, 2027].map((yr) => (
                <option key={yr} value={String(yr)}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Month (shown if mode is month/week/day) */}
          {(filterMode === "month" || filterMode === "week" || filterMode === "day") && (
            <div>
              <label className="mr-2">Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="p-2 border"
              >
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
          )}

          {/* Day (shown if mode is day or week) */}
          {(filterMode === "day" || filterMode === "week") && (
            <div>
              <label className="mr-2">
                {filterMode === "day" ? "Day:" : "Week # in Month (1..5):"}
              </label>
              {filterMode === "day" ? (
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="p-2 border"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                    const dayStr = String(d).padStart(2, "0");
                    return (
                      <option key={dayStr} value={dayStr}>
                        {dayStr}
                      </option>
                    );
                  })}
                </select>
              ) : (
                // "week" => 1..5
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="p-2 border"
                >
                  <option value="">All Weeks</option>
                  <option value="1">Week 1 (Days 1-7)</option>
                  <option value="2">Week 2 (Days 8-14)</option>
                  <option value="3">Week 3 (Days 15-21)</option>
                  <option value="4">Week 4 (Days 22-28)</option>
                  <option value="5">Week 5 (Days 29+)</option>
                </select>
              )}
            </div>
          )}
        </>
      )}

      {/* Custom Range */}
      {filterMode === "customRange" && (
        <div className="flex flex-col sm:flex-row items-start space-y-2 sm:space-y-0 sm:space-x-8">
          {/* "From" date */}
          <div>
            <label className="mr-2">From:</label>
            <div className="flex space-x-2">
              <select
                value={fromDay}
                onChange={(e) => setFromDay(e.target.value)}
                className="p-2 border"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
                  const dStr = String(dayNum).padStart(2, "0");
                  return (
                    <option key={dStr} value={dStr}>
                      {dStr}
                    </option>
                  );
                })}
              </select>

              <select
                value={fromMonth}
                onChange={(e) => setFromMonth(e.target.value)}
                className="p-2 border"
              >
                <option value="01">Jan</option>
                <option value="02">Feb</option>
                <option value="03">Mar</option>
                <option value="04">Apr</option>
                <option value="05">May</option>
                <option value="06">Jun</option>
                <option value="07">Jul</option>
                <option value="08">Aug</option>
                <option value="09">Sep</option>
                <option value="10">Oct</option>
                <option value="11">Nov</option>
                <option value="12">Dec</option>
              </select>

              <select
                value={fromYear}
                onChange={(e) => setFromYear(e.target.value)}
                className="p-2 border"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={String(yr)}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* "To" date */}
          <div>
            <label className="mr-2">To:</label>
            <div className="flex space-x-2">
              <select
                value={toDay}
                onChange={(e) => setToDay(e.target.value)}
                className="p-2 border"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
                  const dStr = String(dayNum).padStart(2, "0");
                  return (
                    <option key={dStr} value={dStr}>
                      {dStr}
                    </option>
                  );
                })}
              </select>

              <select
                value={toMonth}
                onChange={(e) => setToMonth(e.target.value)}
                className="p-2 border"
              >
                <option value="01">Jan</option>
                <option value="02">Feb</option>
                <option value="03">Mar</option>
                <option value="04">Apr</option>
                <option value="05">May</option>
                <option value="06">Jun</option>
                <option value="07">Jul</option>
                <option value="08">Aug</option>
                <option value="09">Sep</option>
                <option value="10">Oct</option>
                <option value="11">Nov</option>
                <option value="12">Dec</option>
              </select>

              <select
                value={toYear}
                onChange={(e) => setToYear(e.target.value)}
                className="p-2 border"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={String(yr)}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
