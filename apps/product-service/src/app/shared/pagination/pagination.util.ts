export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export type SortOrder = 'ASC' | 'DESC';

export function normalizePagination(rawPage?: number, rawLimit?: number) {
  const page = Math.max(DEFAULT_PAGE, Number(rawPage || DEFAULT_PAGE));
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(rawLimit || DEFAULT_LIMIT)));
  const skip = (page - 1) * limit;
  const take = limit;
  return { page, limit, skip, take };
}

/**
 * Parse a sort string into a TypeORM order object.
 * Accepts forms like: "createdAt:desc", "name:asc", "-createdAt".
 * Only allows fields in allowList; otherwise falls back to defaultOrder.
 */
export function parseSort(
  sort: string | undefined,
  allowList: string[],
  defaultOrder: Record<string, SortOrder> = { createdAt: 'DESC' },
) {
  if (!sort) return defaultOrder;
  let field = sort;
  let dir: SortOrder = 'ASC';

  if (sort.includes(':')) {
    const [f, d] = sort.split(':');
    field = f;
    dir = (d || '').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  } else if (sort.startsWith('-')) {
    field = sort.substring(1);
    dir = 'DESC';
  }

  if (!allowList.includes(field)) return defaultOrder;
  return { [field]: dir } as Record<string, SortOrder>;
}

