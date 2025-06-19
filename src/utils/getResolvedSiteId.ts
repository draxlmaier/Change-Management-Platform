// File: src/utils/getResolvedSiteId.ts

export function getResolvedSiteId(): string {
  const siteId = localStorage.getItem("sharepointSiteId");

  if (!siteId) {
    throw new Error("❌ Missing SharePoint site ID. Please resolve it first using the Site Resolver.");
  }

  return siteId;
}
