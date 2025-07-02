// src/services/siteLookupService.ts
import axios from "axios";
import { msalInstance } from "../auth/msalInstance";
import { getAccessToken } from "../auth/getToken";
import { getProjectLogo } from "../utils/getProjectLogo";
import { cmConfigLists, saveConfig, IProject } from "../services/configService";

function canonicalProjectId(input: string): string {
  let normalized = input.trim().toLowerCase().replace(/[\s_]+/g, '-');
  const aliasMap: Record<string, string> = {
    'mercedes': 'mercedes-benz',
    'merc': 'mercedes-benz',
    'mercedes-benz': 'mercedes-benz',
    'mercedesbenz': 'mercedes-benz',
    'vw': 'volkswagen'
  };
  return aliasMap[normalized] ?? normalized;
}

export async function lookupSiteAndLists(siteName: string, projects: IProject[], frequentSites: string[]) {
  // Can extend with progress reporting if needed
  const account = msalInstance.getActiveAccount();
  if (!account) throw new Error("No signed-in account. Please log in.");
  const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Read.All"]);
  if (!token) throw new Error("No token");

  const url = new URL(siteName);
  const path = `${url.hostname}:${url.pathname}:`;
  const siteResp = await axios.get(`https://graph.microsoft.com/v1.0/sites/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const siteId = siteResp.data.id;

  const listsResp = await axios.get(
    `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const fetchedLists = listsResp.data.value;

  // List extraction logic (same as ConfigPage)
  const findListIdByName = (partialName: string) =>
    fetchedLists.find((list: any) =>
      list.displayName.toLowerCase().includes(partialName.toLowerCase())
    )?.id || "";

  const autoQuestionsId = findListIdByName("question");
  const autoMonthlyId = findListIdByName("monthly");
  const autoFollowId = findListIdByName("follow");
  const autoBudgetsId = findListIdByName("budget");
  const autoTargetsId = findListIdByName("target");

  // Project extraction regex logic...
  const regex = /^changes_([a-zA-Z0-9-]+)_phase(4|8)(extra)?$/i;
  const newProjectsMap: { [key: string]: IProject } = {};

  fetchedLists.forEach((list: any) => {
    const match = regex.exec(list.displayName);
    if (!match) return;
    const [, rawProjectName, phase, isExtra] = match;
    const projectId = canonicalProjectId(rawProjectName);
    const existing = newProjectsMap[projectId] || projects.find(p => canonicalProjectId(p.id) === projectId);

    const updatedProject: IProject = existing
      ? { ...existing }
      : {
          id: projectId,
          displayName: rawProjectName,
          logo: getProjectLogo(projectId),
          mapping: {
            implementation: "",
            feasibilityExtra: "",
            implementationExtra: "",
            changeQuestionStatusListId: ""
          },
        };

    if (phase === "4" && isExtra) updatedProject.mapping.feasibilityExtra = list.id;
    else if (phase === "8" && isExtra) updatedProject.mapping.implementationExtra = list.id;
    else if (phase === "8") updatedProject.mapping.implementation = list.id;

    newProjectsMap[projectId] = updatedProject;
  });

  // ChangeQuestionStatus lists
  fetchedLists.forEach((list: any) => {
    const cqsMatch = /^ChangeQuestionStatus_([a-zA-Z0-9-]+)$/i.exec(list.displayName);
    if (!cqsMatch) return;
    const [, rawProjectName] = cqsMatch;
    const projectId = canonicalProjectId(rawProjectName);

    if (!newProjectsMap[projectId]) return;
    newProjectsMap[projectId].mapping.changeQuestionStatusListId = list.id;
  });

  const finalProjects = Object.values(newProjectsMap);

  const newConfig: cmConfigLists = {
    siteId,
    questionsListId: autoQuestionsId,
    monthlyListId: autoMonthlyId,
    followCostListId: autoFollowId,
    budgetsListId: autoBudgetsId,
    phase4TargetsListId: autoTargetsId,
    projects: finalProjects,
    assignedRoles: [], // You can customize
    frequentSites: [...new Set([...frequentSites, siteName])],
  };

  saveConfig(newConfig);

  return { config: newConfig, projects: finalProjects };
}
