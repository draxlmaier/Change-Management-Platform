import axios from 'axios';
import { getAccessToken } from '../auth/getToken';
import { msalInstance } from "../auth/msalInstance";
import { getConfig, saveConfig, cmConfigLists, IProject } from "../services/configService";
import { getProjectLogo } from '../utils/getProjectLogo';  // <-- ADD THIS

export async function updateProjectMappingsFromSites(): Promise<IProject[]> {
  const config = getConfig();
  const { frequentSites = [], projects = [] } = config;

  const token = await getAccessToken(msalInstance, ['https://graph.microsoft.com/Sites.Read.All']);
  const updatedProjectsMap: { [key: string]: IProject } = {};
  const existingProjectsMap = new Map(projects.map(p => [p.id, p]));

  for (const siteName of frequentSites) {
    try {
      const fullUrl = `https://uittunis.sharepoint.com/sites/${siteName}`;
      const url = new URL(fullUrl);
      const path = `${url.hostname}:${url.pathname}:`;

      const siteResp = await axios.get(`https://graph.microsoft.com/v1.0/sites/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const listsResp = await axios.get(
        `https://graph.microsoft.com/v1.0/sites/${siteResp.data.id}/lists`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const regex = /^changes_([a-zA-Z0-9]+)_phase(4|8)(extra)?$/i;

      listsResp.data.value.forEach((list: any) => {
        const match = regex.exec(list.displayName);
        if (!match) return;

        const [_, rawProjectName, phase, isExtra] = match;
        const projectId = rawProjectName.toLowerCase();

        const base = existingProjectsMap.get(projectId) || {
          id: projectId,
          displayName: rawProjectName,
          logo: getProjectLogo(projectId),  // ✅ use resolver here
          mapping: {
            feasibility: '',
            implementation: '',
            feasibilityExtra: '',
            implementationExtra: '',
          },
        };

        const updated = { ...base };

        if (phase === '4' && isExtra) updated.mapping.feasibilityExtra = list.id;
        else if (phase === '4') updated.mapping.feasibility = list.id;
        else if (phase === '8' && isExtra) updated.mapping.implementationExtra = list.id;
        else if (phase === '8') updated.mapping.implementation = list.id;

        updatedProjectsMap[projectId] = updated;
      });
    } catch (err) {
      console.error('Failed to fetch or parse site:', siteName, err);
    }
  }

  const merged = Object.values(updatedProjectsMap);

  const newProjects = Array.from(new Map([...projects, ...merged].map(p => [p.id, { ...p }])).values());

  const updatedConfig: cmConfigLists = {
    ...config,
    projects: newProjects,
  };
  saveConfig(updatedConfig);

  return newProjects;
}
