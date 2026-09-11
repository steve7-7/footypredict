/**
 * Local-timezone date helpers.
 *
 * `new Date().toISOString().split('T')[0]` returns the UTC date, which can be a
 * day behind the user's local calendar (e.g. evenings in UTC+3). These helpers
 * build the date from local components instead.
 */

export function toLocalISODate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
