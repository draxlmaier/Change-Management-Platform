// File: src/pages/DashboardPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

import { useDashboardStats } from '../hooks/useDashboardStats';
import { useMonthlyKPIs }    from '../hooks/useMonthlyKPIs';

import StatsCards         from '../components/dashboard/StatsCards';
import StatsCard          from '../components/dashboard/StatsCard';
import ValidationPieChart from '../components/dashboard/ValidationPieChart';
import ClosedOpenPieChart from '../components/dashboard/ClosedOpenPieChart';

export default function DashboardPage() {
  
  const { project } = useParams<{ project?: string }>();
const projKey = project === 'all' ? 'draxlmaier' : project ?? 'draxlmaier';
  // build a list of the last 5 years
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 2 }, (_, i) => currentYear - i);

  // month names + two state hooks
  const monthNames = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  // default to current month/year
  const now = new Date();
  const [year, setYear]   = React.useState<number>(now.getFullYear());
  const [month, setMonth] = React.useState<string>(
    String(now.getMonth() + 1).padStart(2, '0')
  );

  // combine into "YYYY-MM" for your hooks
  const filterMonth = `${year}-${month}`;

  const {
    stats,
    loading: statsLoading,
    error: statsError
  } = useDashboardStats(projKey, filterMonth);

  const {
    data: mk,
    loading: kpiLoading,
    error: kpiError
  } = useMonthlyKPIs(projKey, filterMonth);

  const loading = statsLoading || kpiLoading;
  const error   = statsError   || kpiError;

  
  return (
    <div className="p-8 space-y-6">
      {/* Header & Month/Year selectors */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold capitalize">
          {projKey === 'draxlmaier' ? 'All Projects' : projKey} Dashboard
        </h1>
        <div className="flex space-x-4">
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="border rounded p-2 bg-white"
          >
            {years.map(y => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="border rounded p-2 bg-white"
          >
            {monthNames.map(m => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading / Error */}
      {loading }
      {error && (
        <p className="text-red-600">
          Error: {error.message}
        </p>
      )}

      {/* KPI display */}
      {stats && mk && (
        <div className="space-y-8">
          {/* 1) total changes + per-area */}
          <StatsCards
            totalChanges={stats.totalChanges}
            changesByArea={stats.changesByArea}
          />

          {/* 2) Monthly KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard label="DRX Idea"           value={mk.drxIdea}    />
            <StatsCard label="Budget Department"  value={mk.budgetDept} />
            <StatsCard label="Unplanned Downtime" value={mk.unplanned}   />
          </div>

          {/* 3) Pie charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <section className="bg-white p-4 rounded shadow">
      <h2 className="font-semibold mb-2">Validation Rate</h2>
      <ValidationPieChart
        validatedCount={stats.validatedCount}
        notValidatedCount={stats.notValidatedCount}
      />
    </section>

    <section className="bg-white p-4 rounded shadow">
      <h2 className="font-semibold mb-2">Closed vs. Open</h2>
      <ClosedOpenPieChart
        closedCount={stats.closedCount}
        openCount={stats.openCount}
      />
    </section>
          </div>
        </div>
      )}
    </div>
  );
}
