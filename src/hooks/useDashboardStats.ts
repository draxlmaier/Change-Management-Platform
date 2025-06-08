// File: src/hooks/useDashboardStats.ts
import { useState, useEffect } from 'react';
import { getGraphClient } from '../utils/graphClient';
import { useMsal } from '@azure/msal-react';

function normalizeArea(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes('cockpit')) return 'Cockpit';
  if (s.includes('autark')) return 'Autarke';
  if (s.includes('innenraum')) return 'Innenraum';
  if (s.includes('motorblick') || s.includes('rl')) return 'Motorblick';
  return raw;
}

export interface DashboardStats {
  totalChanges: number;
  changesByArea: Record<string, number>;

  // raw counts for pies
  validatedCount: number;
  notValidatedCount: number;
  closedCount: number;
  openCount: number;

  // percent rates
  validatedRate: number;
  closedRate: number;
}

export function useDashboardStats(
  project: string,
  month: string
): { stats: DashboardStats | null; loading: boolean; error: any } {
  const { instance, accounts } = useMsal();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!instance || !accounts.length) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        // Retrieve the configuration from local storage
        const rawConfig = localStorage.getItem("cmConfigLists");
        if (!rawConfig) throw new Error('No configuration found in local storage.');

        const cfg = JSON.parse(rawConfig);
        if (!cfg?.siteId) throw new Error('Missing siteId in config.');
        const siteId = cfg.siteId;

        // Check if cfg.projects is an array or an object
        const projects = Array.isArray(cfg.projects) ? cfg.projects : Object.values(cfg.projects);

        // Build list of list-IDs to query
        let listIds: string[] = [];
        const proj = projects.find((p: any) => p.id === project); // Find project by ID
        if (!proj) throw new Error(`No project found with ID '${project}'.`);

        const m = proj?.mapping?.implementation;
        if (!m) throw new Error(`No list mapping for project '${project}'.`);
        listIds = [m];

        const client = getGraphClient(instance, accounts[0]);

        // Fetch *all* items (no pagination helper here — page size assumed small)
        let allItems: any[] = [];
        for (const id of listIds) {
          const res: any = await client
            .api(`/sites/${siteId}/lists/${id}/items?expand=fields`)
            .get();
          allItems = allItems.concat(res.value || []);
        }

        // Filter by month prefix on Process number
        const prefix = 'DRX_' + month.replace('-', '_');
        const filtered = allItems.filter(item => {
          const proc = item.fields['Process_x0020_number_x0020__x002'];
          return typeof proc === 'string' && proc.startsWith(prefix);
        });

        const total = filtered.length;

        // Normalize areas
        const byArea: Record<string, number> = {};
        filtered.forEach(item => {
          const raw = item.fields['SheetName'] as string || 'Unknown';
          const area = normalizeArea(raw);
          byArea[area] = (byArea[area] || 0) + 1;
        });

        const validatedCount = filtered.filter(i => i.fields.validation === 1).length;
        const notValidatedCount = total - validatedCount;
        const closedCount = filtered.filter(i => i.fields.feasability === 1).length;
        const openCount = total - closedCount;

        const validatedRate = total ? Math.round((validatedCount / total) * 100) : 0;
        const closedRate = total ? Math.round((closedCount / total) * 100) : 0;

        setStats({
          totalChanges: total,
          changesByArea: byArea,
          validatedCount,
          notValidatedCount,
          closedCount,
          openCount,
          validatedRate,
          closedRate,
        });
      } catch (e) {
        console.error("Error fetching stats:", e); // Log the error for debugging
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [project, month, instance, accounts]);

  return { stats, loading, error };
}
