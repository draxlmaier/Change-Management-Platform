// src/components/dashboardParts/DraxlOverview.tsx
import React, { useState, useMemo, useEffect } from 'react';
import DraxlameirSmallMultiples from '../changes/DraxlameirSmallMultiples';
import AreaProjectNestedDonut    from '../changes/AreaProjectNestedDonut';
import AutarkeSubareasPieChart   from '../changes/AutarkeSubareasPieChart';
import AreaHybridChart           from '../changes/AreaHybridChart';
import TotalAreaHybridChart      from './TotalAreaHybridChart';
import { SubAreaPieChart }       from './SubAreaPieChart';
import { ChangeItem }            from '../../../pages/types';

type AreaMode = 'year' | 'month';
type ViewBy   = 'week' | 'day';
type YearView = 'all'  | 'single';

interface Props {
  items: ChangeItem[];
}

const DraxlOverview: React.FC<Props> = ({ items }) => {
  // ── 1) normalize all dates to zero-padded strings ──
  const normItems = useMemo(() => {
    return items.map(i => ({
      ...i,
      processyear:  String(i.processyear  ?? '').padStart(4, '0'),
      processmonth: String(i.processmonth ?? '').padStart(2, '0'),
      processday:   String(i.processday   ?? '').padStart(2, '0'),
    }));
  }, [items]);

  // ── 2) local filter state ──
  const [areaMode, setAreaMode]   = useState<AreaMode>('year');
  const [viewBy,   setViewBy]     = useState<ViewBy>('week');
  const [yearView, setYearView]   = useState<YearView>('all');
  const now = new Date();
  const [areaYear,  setAreaYear]  = useState(String(now.getFullYear()));
  const [areaMonth, setAreaMonth] = useState(
    String(now.getMonth() + 1).padStart(2, '0')
  );

  // ── 3) bring in our “working copy” and local “filtered” list ──
  const [allLocalItems,      setAllLocalItems]      = useState<ChangeItem[]>([]);
  const [filteredLocalItems, setFilteredLocalItems] = useState<ChangeItem[]>([]);

  // whenever the parent gives us new props, reset our local copy
  useEffect(() => {
    setAllLocalItems(normItems);
  }, [normItems]);

  // actually filter whenever any of the local controls change
  useEffect(() => {
    let result = allLocalItems;

    // if single‐year drill-in, or month mode, restrict by year first
    if (yearView === 'single' || areaMode === 'month') {
      result = result.filter(i => i.processyear === areaYear);
    }

    // if month mode, further restrict by month
    if (areaMode === 'month') {
      result = result.filter(i => i.processmonth === areaMonth);
    }

    setFilteredLocalItems(result);
  }, [allLocalItems, areaMode, viewBy, yearView, areaYear, areaMonth]);

  // ── 4) recompute the list of areas from the **filtered** items ──
  const areas = useMemo(
    () => Array.from(new Set(filteredLocalItems.map(i => i.SheetName || 'Unknown'))),
    [filteredLocalItems]
  );

  return (
    <div className="space-y-6">
      {/* ── LOCAL FILTER BAR ── */}
      <div className="sticky top-16 bg-white z-20 p-4 flex flex-wrap items-center gap-4 border-b">
        <label className="font-medium">Area Charts:</label>
        {/* year vs month */}
        <select
          value={areaMode}
          onChange={e => setAreaMode(e.target.value as AreaMode)}
          className="border px-2 py-1 rounded"
        >
          <option value="year">Year</option>
          <option value="month">Month</option>
        </select>

        {/* always‐visible year picker */}
        <select
          value={areaYear}
          onChange={e => setAreaYear(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          {Array.from({ length: 5 }, (_, i) =>
            String(now.getFullYear() - i)
          ).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* month‐mode extra controls */}
        {areaMode === 'month' ? (
          <>
            <select
              value={viewBy}
              onChange={e => setViewBy(e.target.value as ViewBy)}
              className="border px-2 py-1 rounded"
            >
              <option value="week">By Week</option>
              <option value="day">By Day</option>
            </select>
            <select
              value={areaMonth}
              onChange={e => setAreaMonth(e.target.value)}
              className="border px-2 py-1 rounded"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const m = String(i + 1).padStart(2, '0');
                return (
                  <option key={m} value={m}>
                    {new Date(0, i).toLocaleString('en-US', { month: 'long' })}
                  </option>
                );
              })}
            </select>
          </>
        ) : (
          /* year‐mode: all vs single year */
          <select
            value={yearView}
            onChange={e => setYearView(e.target.value as YearView)}
            className="border px-2 py-1 rounded"
          >
            <option value="all">All Years</option>
            <option value="single">Single Year</option>
          </select>
        )}
      </div>

      {/* ── VISUALS ── */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Draxlameir Overview</h2>

        {/* small multiples uses filteredLocalItems */}
        <DraxlameirSmallMultiples items={filteredLocalItems} />

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">
            Changes by Area &amp; Project
          </h3>
          <AreaProjectNestedDonut items={filteredLocalItems} />
        </div>

        <TotalAreaHybridChart
          items={filteredLocalItems}
          filterMode={areaMode}
          viewBy={viewBy}
          selectedYear={areaYear}
          selectedMonth={areaMonth}
          yearViewMode={yearView}
        />

        {areas.map(a => (
          <AreaHybridChart
            key={a}
            area={a}
            items={filteredLocalItems}
            filterMode={areaMode}
            viewBy={viewBy}
            selectedYear={areaYear}
            selectedMonth={areaMonth}
            yearViewMode={yearView}
          />
        ))}

        <div className="bg-white rounded-lg shadow-md p-6">
          <SubAreaPieChart items={filteredLocalItems} />
        </div>
        <AutarkeSubareasPieChart items={filteredLocalItems} />
      </div>
    </div>
  );
};

export default DraxlOverview;
