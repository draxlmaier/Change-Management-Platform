import axios from 'axios';
import { getConfig, saveConfig, cmConfigLists, IProject } from "../services/configService";
import { getProjectLogo } from '../utils/getProjectLogo';

export async function updateProjectMappingsFromSites(token: string): Promise<IProject[]> {
  const config = getConfig();
  const { frequentSites = [], projects = [] } = config;

  const updatedProjectsMap: { [key: string]: IProject } = {};
  const existingProjectsMap = new Map(projects.map(p => [p.id, p]));

  // Regex to match ONLY SharePoint Team Sites (not personal/OneDrive or invalid)
  const teamSitePattern = /^https:\/\/[a-zA-Z0-9-]+\.sharepoint\.com\/sites\/[a-zA-Z0-9-_]+/i;

  for (const siteUrl of frequentSites) {
    try {
      // Filter: Skip non-team site URLs
      if (!teamSitePattern.test(siteUrl)) {
        console.warn('Skipping unsupported or invalid SharePoint site:', siteUrl);
        continue;
      }

      const url = new URL(siteUrl);
      const hostname = url.hostname;
      const path = url.pathname.replace(/^\/sites\//, "");

      const graphSiteUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:/sites/${path}`;
      const siteResp = await axios.get(graphSiteUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const siteId = siteResp.data.id;

      const listsResp = await axios.get(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Detect changes lists
      const changeListRegex = /^changes_([a-zA-Z0-9]+)_phase(4|8)(extra)?$/i;
      listsResp.data.value.forEach((list: any) => {
        const match = changeListRegex.exec(list.displayName);
        if (!match) return;

        const [, rawProjectName, phase, isExtra] = match;
        const projectId = rawProjectName.toLowerCase();

        const base = existingProjectsMap.get(projectId) || {
          id: projectId,
          displayName: rawProjectName,
          logo: getProjectLogo(projectId),
          mapping: {
            implementation: '',
            feasibilityExtra: '',
            implementationExtra: '',
            changeQuestionStatusListId: '',
          },
        };

        const updated = { ...base };

        if (phase === '4' && isExtra) updated.mapping.feasibilityExtra = list.id;
        else if (phase === '8' && isExtra) updated.mapping.implementationExtra = list.id;
        else if (phase === '8') updated.mapping.implementation = list.id;

        updatedProjectsMap[projectId] = updated;
      });

      // Detect ChangeQuestionStatus lists
      const cqsRegex = /^ChangeQuestionStatus_([a-zA-Z0-9]+)$/i;
      listsResp.data.value.forEach((list: any) => {
        const match = cqsRegex.exec(list.displayName);
        if (!match) return;

        const rawProjectName = match[1];
        const projectId = rawProjectName.toLowerCase();

        const base = updatedProjectsMap[projectId] || existingProjectsMap.get(projectId) || {
          id: projectId,
          displayName: rawProjectName,
          logo: getProjectLogo(projectId),
          mapping: {
            implementation: '',
            feasibilityExtra: '',
            implementationExtra: '',
            changeQuestionStatusListId: '',
          },
        };

        const updated = {
          ...base,
          mapping: {
            ...base.mapping,
            changeQuestionStatusListId: list.id,
          },
        };

        updatedProjectsMap[projectId] = updated;
      });

    } catch (err) {
      // Only log real fetch or parsing errors
      console.error('Failed to fetch or parse SharePoint team site:', siteUrl, err);
    }
  }

  // Merge new project mappings with any old entries not overwritten
  const merged = Object.values(updatedProjectsMap);
  const newProjects = Array.from(
    new Map([...projects, ...merged].map(p => [p.id, { ...p }])).values()
  );

  const updatedConfig: cmConfigLists = {
    ...config,
    projects: newProjects,
  };

  saveConfig(updatedConfig);
  return newProjects;
}
