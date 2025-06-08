// src/hooks/useMonthlyKPIs.ts
import { useState, useEffect } from 'react';
import { getGraphClient } from '../utils/graphClient';
import { readConfig } from '../utils/cmConfig';
import { useMsal } from '@azure/msal-react';

export interface MonthlyKPIs {
  drxIdea: number;
  budgetDept: number;
  unplanned: number;
  scrapFollowing: number;
}

export function useMonthlyKPIs(
  project: string,
  month: string  // e.g. "2025-03"
): { data: MonthlyKPIs; loading: boolean; error: any } {
  const { instance, accounts } = useMsal();
  const [data, setData] = useState<MonthlyKPIs>({
    drxIdea: 0,
    budgetDept: 0,
    unplanned: 0,
    scrapFollowing: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchKPIs() {
      setLoading(true);
      try {
        const cfg = readConfig();
        if (!cfg?.siteId || !cfg.monthlyListId) {
          throw new Error('Missing MonthlyKPIs list in config');
        }

        // grab everything
        const client = getGraphClient(instance, accounts[0]!);
        const res = await client
          .api(
            `/sites/${cfg.siteId}/lists/${cfg.monthlyListId}/items?expand=fields`
          )
          .get();
        const items: any[] = res.value || [];

        // normalize month to YYYY-MM
        const wanted = month; // "2025-03"

        // filter by Month field _and_ by Project (unless "draxlmaier")
        const filtered = items.filter(it => {
          const raw = it.fields.Month as string | Date;
          // get "YYYY-MM"
          const itemMonth = new Date(raw).toISOString().slice(0, 7);
          const matchesMonth = itemMonth === wanted;

          const projField = it.fields.Project as string;
          const matchesProject =
            project === 'draxlmaier' || projField.toLowerCase() === project;

          return matchesMonth && matchesProject;
        });

        // sum up each KPI
        let drx = 0,
          bud = 0,
          down = 0,
          scrap = 0;
        filtered.forEach(it => {
          drx += Number(it.fields.DRXIdea) || 0;
          bud += Number(it.fields.BudgetDepartment) || 0;
          down += Number(it.fields.UnplanneddowntimecausedbyTechnic) || 0;
          scrap += Number(it.fields.ScrapFollowing) || 0;
        });

        setData({
          drxIdea: drx,
          budgetDept: bud,
          unplanned: down,
          scrapFollowing: scrap,
        });
        setError(null);
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    }

    if (instance && accounts.length) {
      fetchKPIs();
    }
  }, [project, month, instance, accounts]);

  return { data, loading, error };
}
