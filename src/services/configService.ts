
// services/configService.ts

const LISTS_CONFIG_KEY = "cmConfigLists";

export interface IProject {
  id: string;
  displayName: string;
  logo?: string;
  mapping: {
    feasibility: string;
    implementation: string;
    feasibilityExtra?: string;
    implementationExtra?: string;
  };
}

export interface cmConfigLists {
  siteId: string;
  questionsListId: string;
  monthlyListId: string;
  followCostListId: string;
  projects: IProject[];
  assignedRoles?: { email: string; role: string }[];
  frequentSites?: string[];
}

export function getConfig(): cmConfigLists {
  const raw = localStorage.getItem(LISTS_CONFIG_KEY);
  if (!raw) {
    return {
      siteId: "",
      questionsListId: "",
      monthlyListId: "",
      followCostListId: "",
      projects: [],
      assignedRoles: [],
      frequentSites: [],
    };
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("Invalid config format in localStorage:", err);
    return {
      siteId: "",
      questionsListId: "",
      monthlyListId: "",
      followCostListId: "",
      projects: [],
      assignedRoles: [],
      frequentSites: [],
    };
  }
}

export function saveConfig(config: cmConfigLists) {
  localStorage.setItem(LISTS_CONFIG_KEY, JSON.stringify(config));
}

export function upsertProjectMapping(projectId: string, displayName: string, phase: string, listId: string) {
  const config = getConfig();
  let project = config.projects.find(p => p.id === projectId.toLowerCase());

  if (!project) {
    project = {
      id: projectId.toLowerCase(),
      displayName,
      mapping: {
        feasibility: "",
        implementation: "",
        feasibilityExtra: "",
        implementationExtra: "",
      },
    };
    config.projects.push(project);
  }

  if (phase === "phase4") project.mapping.feasibility = listId;
  else if (phase === "phase4extra") project.mapping.feasibilityExtra = listId;
  else if (phase === "phase8") project.mapping.implementation = listId;
  else if (phase === "phase8extra") project.mapping.implementationExtra = listId;

  saveConfig(config);
}
