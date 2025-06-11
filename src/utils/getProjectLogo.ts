// src/utils/getProjectLogo.ts

import { PROJECT_LOGO_MAP } from '../constants/projects';
import otherLogo from '../assets/images/logos/other.png';

// Clean normalization & alias resolver
export function getProjectLogo(id: string | undefined | null): string {
  if (!id) return otherLogo;

  const normalized = id.trim().toLowerCase().replace(/[\s_]+/g, '-');

  // Known alias mappings
  const aliasMap: Record<string, string> = {
    'mercedes': 'mercedes-benz',
    'merc': 'mercedes-benz',
    'vw': 'volkswagen',
  };

  const finalKey = aliasMap[normalized] ?? normalized;

  return PROJECT_LOGO_MAP[finalKey] ?? otherLogo;
}
