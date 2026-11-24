/**
 * Stackra file contract:
 * Purpose: the page of the home route: what the panel shows before any resource is registered.
 * Boundary: presentation only.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 14, rule R7).
 */

/** The page's words, in one place until @stackra/i18n serves them. */
const STRINGS = {
  empty: "No resources registered yet.",
};

// shortcut: the empty state; @stackra/panel exists now and renders the registry's resources (`extends Resource(Model)`,
// ADR 0164) once the app declares one.
/** The landing page of the panel. */
export function Home() {
  return <p>{STRINGS.empty}</p>;
}
