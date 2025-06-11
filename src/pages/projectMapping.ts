import axios from 'axios';
import { getConfig, saveConfig, cmConfigLists, IProject } from "../services/configService";
import { getProjectLogo } from '../utils/getProjectLogo';

/**
 * Updated: expects token passed externally.
 */
export async function updateProjectMappingsFromSites(token: string): Promise<IProject[]> {
  const config = getConfig();
  const { frequentSites = [], projects = [] } = config;

  const updatedProjectsMap: { [key: string]: IProject } = {};
  const existingProjectsMap = new Map(projects.map(p => [p.id, p]));

  for (const siteUrl of frequentSites) {
    try {
      // siteUrl may already be a full URL or just a sitename. Handle both
      let hostname = '';
      let path = '';

      if (siteUrl.startsWith("https://")) {
        // Full URL case
        const url = new URL(siteUrl);
        hostname = url.hostname;  // e.g. draexlmaier.sharepoint.com
        path = url.pathname.replace(/^\/sites\//, ""); // e.g. ittest
      } else {
        // Only site name (short form), assume default tenant hostname:
        hostname = "uittunis.sharepoint.com";  // <-- default fallback
        path = siteUrl;
      }

      // Build valid Graph API URL
      const graphSiteUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:/sites/${path}`;

      const siteResp = await axios.get(graphSiteUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const siteId = siteResp.data.id;

      const listsResp = await axios.get(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`,
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
          logo: getProjectLogo(projectId),
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
      console.error('Failed to fetch or parse site:', siteUrl, err);
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
