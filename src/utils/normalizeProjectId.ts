// utils/normalizeProjectId.ts

export function normalizeProjectId(raw: string): string {
  // Lowercase, trim, replace any sequence of spaces/underscores with hyphens
  return raw.trim().toLowerCase().replace(/[\s_]+/g, '-');
}
