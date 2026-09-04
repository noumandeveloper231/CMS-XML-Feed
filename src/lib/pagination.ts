export const PAGE_SIZE_OPTIONS = [50, 100, 150, 200, 500] as const;

export function buildPaginationItems(
  currentPage: number,
  totalPages: number | null
): (number | "...")[] {
  if (totalPages == null || totalPages <= 1) return [1];

  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  for (let p = currentPage - 1; p <= currentPage + 1; p += 1) {
    if (p > 1 && p < totalPages) pages.add(p);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: (number | "...")[] = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const value = sorted[i];
    if (i > 0 && value - sorted[i - 1] > 1) result.push("...");
    result.push(value);
  }
  return result;
}

export function clampPage(page: number, totalPages: number): number {
  if (totalPages < 1) return 1;
  return Math.min(Math.max(1, page), totalPages);
}

export function toJobSummary<T extends { description?: string }>(
  job: T
): Omit<T, "description"> {
  const { description: _description, ...rest } = job;
  return rest;
}
