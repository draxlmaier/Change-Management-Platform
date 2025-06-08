// File: src/utils/dateUtils.ts

/**
 * Extracts the year–month portion from a SharePoint “Process number” string.
 *
 * The expected format is: DRX_YYYY_MM_DD_xxx
 * E.g. "DRX_2024_01_05_011" → "2024-01"
 *
 * @param processNumber The raw process-number field from SharePoint.
 * @returns An ISO-style "YYYY-MM" string, or null if the format doesn't match.
 */
export function extractYearMonth(processNumber: string): string | null {
    // Use a regular expression to pull out the year and month
    const match = processNumber.match(/^DRX_(\d{4})_(\d{2})_/);
    if (!match) {
      console.warn(`Could not parse month from processNumber="${processNumber}"`);
      return null;
    }
    const [, year, month] = match;
    return `${year}-${month}`;
  }
  