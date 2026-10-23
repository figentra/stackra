/**
 * Stackra file contract:
 * Purpose: the page of the home route: what the panel shows before any resource is registered.
 * Boundary: presentation only.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 14, rule R7).
 */

// shortcut: a placeholder until @stackra/panel renders the registry's resources (`extends Resource(Model)`, ADR 0164).
/** The landing page of the panel. */
export function Home() {
  return <p>No resources registered yet.</p>;
}
