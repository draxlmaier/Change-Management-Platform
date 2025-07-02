import React, { useState, useEffect, useMemo } from "react";
import ProjectCarousel from "../ProjectCarousel";
import axios from "axios";

// === Interfaces ===

export interface Project {
  id: string;
  displayName: string;
}
export interface ChangeItem {
  ID: string;
  Project?: string;
  Carline?: string;
  Processnumber?: string;
  StartdatePhase4?: string;
  EnddatePAVPhase4?: string;
  EndDateLogisticPhase4?: string;
  EndDateQSPhase4?: string;
  EndDatePSCRPhase4?: string;
  processyear?: string;
  processmonth?: string;
  processid?: string;
}
interface Phase4ClosureDashboardProps {
  projects: Project[];
  changeItems: ChangeItem[];
  phase4TargetsListId?: string;
  siteId: string;
  getToken: () => Promise<string>;
}
interface SharePointTargetItem {
  id: string;
  Project: string;
  Department: string;
  Target: number;
}

const DEPARTMENTS = [
  { key: "PAV", label: "PaV", endField: "EnddatePAVPhase4" },
  { key: "LOGISTIC", label: "Logistic", endField: "EndDateLogisticPhase4" },
  { key: "QS", label: "QS", endField: "EndDateQSPhase4" },
  { key: "PSCR", label: "PSCR", endField: "EndDatePSCRPhase4" },
];

// Calculate business days between two dates (excluding weekends)
function calculateBusinessDays(startStr?: string, endStr?: string): number | "" {
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

const Phase4ClosureDashboard: React.FC<Phase4ClosureDashboardProps> = ({
  projects,
  changeItems,
  phase4TargetsListId,
  siteId,
  getToken,
}) => {
  const now = new Date();
  const [selectedProject, setSelectedProject] = useState<string>(projects[0]?.id || "");
  const [targets, setTargets] = useState<{ [projectId: string]: { [dep: string]: number } }>({});
  const [spTargetItems, setSpTargetItems] = useState<SharePointTargetItem[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));

  // Fetch targets from SharePoint on mount or project change
  useEffect(() => {
    const fetchTargets = async () => {
      if (!phase4TargetsListId || !siteId) return;
      setLoadingTargets(true);
      try {
        const token = await getToken();
        const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${phase4TargetsListId}/items?expand=fields&$top=999`;
        const resp = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Parse items
        const items: SharePointTargetItem[] = resp.data.value
          .map((item: any) => ({
            id: item.id,
            Project: item.fields.Project,
            Department: item.fields.Department,
            Target: Number(item.fields.Target),
          }))
          .filter((it: SharePointTargetItem) => it.Project && it.Department);

        setSpTargetItems(items);

        // Convert to local state structure
        const newTargets: { [projectId: string]: { [dep: string]: number } } = {};
        projects.forEach(proj => {
          const projTargets: { [dep: string]: number } = {};
          DEPARTMENTS.forEach(dep => {
            const tItem = items.find(
              (it) =>
                (it.Project === proj.displayName || it.Project === proj.id) &&
                it.Department === dep.key
            );
            if (tItem) projTargets[dep.key] = tItem.Target;
          });
          if (Object.keys(projTargets).length) {
            newTargets[proj.id] = projTargets;
          }
        });
        setTargets(newTargets);
      } catch (e) {
        console.error("Failed to fetch targets from SP:", e);
      }
      setLoadingTargets(false);
    };
    fetchTargets();
    // eslint-disable-next-line
  }, [phase4TargetsListId, siteId, projects]);

  // --- Filter by project/month/year
  const years = useMemo(
    () =>
      Array.from(
        new Set(changeItems.map(i => i.processyear).filter(Boolean))
      ).sort(),
    [changeItems]
  );
  const months = useMemo(
    () =>
      Array.from(
        new Set(changeItems.filter(i => i.processyear === selectedYear).map(i => i.processmonth?.padStart(2, "0")))
      ).sort(),
    [changeItems, selectedYear]
  );

  const currentProject = projects.find((p) => p.id === selectedProject);

  const filteredItems = useMemo(
    () =>
      changeItems.filter(
        i =>
          (i.Project?.toLowerCase() === currentProject?.displayName.toLowerCase() ||
            i.Project?.toLowerCase() === currentProject?.id.toLowerCase()) &&
          i.processyear === selectedYear &&
          i.processmonth?.padStart(2, "0") === selectedMonth
      ),
    [changeItems, currentProject, selectedYear, selectedMonth]
  );
// --- Handlers ---
const handleTargetChange = async (dep: string, value: string | number) => {
  const targetVal = Number(value) || 0;
  const projectObj = projects.find((p) => p.id === selectedProject);
  if (!projectObj) return;

  // Update local state
  setTargets((prev) => ({
    ...prev,
    [selectedProject]: {
      ...prev[selectedProject],
      [dep]: targetVal,
    },
  }));

  // Update (or create) target in SharePoint
  try {
    const token = await getToken();
    // Check if exists
    const existing = spTargetItems.find(
      (it) =>
        (it.Project === projectObj.displayName || it.Project === projectObj.id) &&
        it.Department === dep
    );

    if (existing) {
      // Update
      const patchUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${phase4TargetsListId}/items/${existing.id}/fields`;
      await axios.patch(
        patchUrl,
        { Target: targetVal },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update local SharePoint targets
      setSpTargetItems((prev) =>
        prev.map((item) =>
          item.id === existing.id ? { ...item, Target: targetVal } : item
        )
      );
    } else {
      // Create
      const postUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${phase4TargetsListId}/items`;
      await axios.post(
        postUrl,
        {
          fields: {
            Project: projectObj.displayName,
            Department: dep,
            Target: targetVal,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh targets from SP
      setTimeout(() => {
        (async () => {
          const token2 = await getToken();
          const url2 = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${phase4TargetsListId}/items?expand=fields&$top=999`;
          const resp2 = await axios.get(url2, {
            headers: { Authorization: `Bearer ${token2}` },
          });
          const items2: SharePointTargetItem[] = resp2.data.value
            .map((item: any) => ({
              id: item.id,
              Project: item.fields.Project,
              Department: item.fields.Department,
              Target: Number(item.fields.Target),
            }))
            .filter((it: SharePointTargetItem) => it.Project && it.Department);
          setSpTargetItems(items2);
        })();
      }, 1000);
    }
  } catch (err) {
    alert("Failed to update target in SharePoint. Check your permissions.");
    console.error(err);
  }
};

  return (
    <div className="max-w-5xl mx-auto">
      {/* Project, Year, Month selection */}
        <div style={{ minWidth: 200 }}>
          <ProjectCarousel
            projects={projects}
            selectedProject={selectedProject}
            onProjectSelect={setSelectedProject}
          />
        </div>
        
      

      {/* Target Inputs for departments */}
      <div className="mb-4 flex flex-wrap gap-8">
        {DEPARTMENTS.map((dep) => (
          <div key={dep.key} className="flex flex-col items-start">
            <label className="mb-1 text-sm text-gray-700 font-medium">
              Target for {dep.label} (days)
            </label>
            <input
              type="number"
              min={0}
              value={targets[selectedProject]?.[dep.key] ?? ""}
              onChange={e => handleTargetChange(dep.key, e.target.value)}
              className="px-3 py-2 rounded border border-gray-300"
              style={{ width: 90 }}
              disabled={loadingTargets}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Phase4ClosureDashboard;
