/**
 * Stackra file contract:
 * Purpose: `suggestUrl`, the "Suggest an improvement" link of a doc page: a new GitHub issue in the Stackra repository,
 *          its title naming the page and labelled for the design system.
 * Boundary: a pure function; the title is encoded, nothing else is sent.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (doc pages wave, 2026-10-28).
 */

/** The repository issues accept these. */
const NEW_ISSUE = "https://github.com/figentra/stackra/issues/new";

/** The new-issue link for the page called `page` ("Button", "Actions"). */
export function suggestUrl(page: string): string {
  const query = new URLSearchParams({ title: `[docs] ${page}: `, labels: "design-system,docs" });
  return `${NEW_ISSUE}?${query.toString()}`;
}
