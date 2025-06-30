// services/configService.ts

const LISTS_CONFIG_KEY = "cmConfigLists";

export interface IProject {
  id: string;
  displayName: string;
  logo?: string;
  mapping: {
    implementation: string;
    implementationExtra?: string;
    feasibilityExtra?: string;
    changeQuestionStatusListId?: string;
  };
}

export interface cmConfigLists {
  siteId: string;
  questionsListId: string;
  monthlyListId: string;
  followCostListId: string;
  usersListId?: string;
  budgetsListId?: string;
  changeQuestionStatusListId?: string;
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
        implementation: "",
        implementationExtra: "",
        feasibilityExtra: "",
        changeQuestionStatusListId: "",
      },
    };
    config.projects.push(project);
  }

  if (phase === "phase4extra") project.mapping.feasibilityExtra = listId;
  else if (phase === "phase8") project.mapping.implementation = listId;
  else if (phase === "phase8extra") project.mapping.implementationExtra = listId;
  else if (phase === "changequestionstatus") project.mapping.changeQuestionStatusListId = listId;

  saveConfig(config);
}
