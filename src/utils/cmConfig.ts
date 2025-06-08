// src/utils/cmConfig.ts

export interface CmConfig {
  siteId: string;
  questionsListId: string;
  monthlyListId: string;
  followCostListId: string;
  projects: Record<string, { mapping?: { feasibility?: string; implementation?: string } }>;
}

/**
 * Read configuration from localStorage.
 * @returns CmConfig or null if not found/invalid.
 */
export function readConfig(): CmConfig | null {
  try {
    // Parse 'cmConfig' as JSON, falling back to null
    return JSON.parse(localStorage.getItem("cmConfig") || "null") as CmConfig;
  } catch {
    return null;
  }
}

/**
 * Save the questions list ID to config.
 */
export function saveQuestionsList(listId: string): void {
  const cfg = readConfig() || {
    siteId: "",
    questionsListId: "",
    monthlyListId: "",
    followCostListId: "",
    projects: {},
  };
  cfg.questionsListId = listId;
  localStorage.setItem("cmConfig", JSON.stringify(cfg));
}

/**
 * Save the Monthly KPIs list ID to config.
 */
export function saveMonthlyList(listId: string): void {
  const cfg = readConfig() || {
    siteId: "",
    questionsListId: "",
    monthlyListId: "",
    followCostListId: "",
    projects: {},
  };
  cfg.monthlyListId = listId;
  localStorage.setItem("cmConfig", JSON.stringify(cfg));
}

/**
 * Save the Follow-up Cost KPI list ID to config.
 */
export function saveFollowCostList(listId: string): void {
  const cfg = readConfig() || {
    siteId: "",
    questionsListId: "",
    monthlyListId: "",
    followCostListId: "",
    projects: {},
  };
  cfg.followCostListId = listId;
  localStorage.setItem("cmConfig", JSON.stringify(cfg));
}

/**
 * Save per-project mapping (implementation list).
 */
export function saveProjectMapping(
  project: string,
  listId: string
): void {
  const cfg = readConfig() || {
    siteId: "",
    questionsListId: "",
    monthlyListId: "",
    followCostListId: "",
    projects: {},
  };
  const existing = cfg.projects[project] || { mapping: {} };
  existing.mapping = { ...existing.mapping, implementation: listId };
  cfg.projects[project] = existing;
  localStorage.setItem("cmConfig", JSON.stringify(cfg));
}
