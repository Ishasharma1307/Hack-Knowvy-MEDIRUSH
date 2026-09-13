/**
 * Normalizes medicine names for consistent inventory matching without altering clinical identity.
 * 
 * Rules:
 * - Trims whitespace
 * - Converts to lowercase
 * - Collapses multiple spaces into a single space
 * - Replaces hyphens and underscores with spaces for standard word boundaries
 * - Retains dosage numbers and units (e.g., "650", "500mg")
 * - Does NOT make unsafe medical substitutions (e.g., "Dolo" !== "Dolo 650")
 */
export function normalizeMedicineName(name: string): string {
  if (!name) return '';

  return name
    .trim()
    .toLowerCase()
    .replace(/[-_]/g, ' ')               // normalize hyphens/underscores to spaces
    .replace(/[^\w\s]/g, '')             // remove other punctuation
    .replace(/\s+/g, ' ')               // collapse multiple spaces
    .trim();
}

/**
 * Checks whether a requested medicine matches an inventory medicine item.
 * Strict on dosage if specified in both, flexible on minor suffix variations.
 */
export function areMedicineNamesMatching(requestedName: string, inventoryName: string): boolean {
  const normReq = normalizeMedicineName(requestedName);
  const normInv = normalizeMedicineName(inventoryName);

  if (normReq === normInv) return true;

  // Exact match on base plus strength
  // If requested is "dolo 650", it matches "dolo 650" or "dolo 650 tablet"
  if (normInv.startsWith(normReq + ' ') || normReq.startsWith(normInv + ' ')) {
    return true;
  }

  return false;
}
