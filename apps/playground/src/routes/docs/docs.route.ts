/**
 * Stackra file contract:
 * Purpose: the Docs home route of @figentra/playground: `/docs`, the page the top bar's Docs tab opens. The page it
 *          renders is `docs.tsx` beside it. Its path names no registry entry, so page discovery lists it apart.
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16); STA-1371 (Docs home, owner approval 2026-10-29).
 */
import { Route } from "@stackra/navigation";

/** The Docs home, at `/docs`. */
export class DocsRoute extends Route({ path: "/docs" }) {
  /** The router handle: the top bar lights Docs here. */
  static readonly handle = { section: "docs" } as const;
}
