/**
 * Stackra file contract:
 * Purpose: `RegistryCheckInput`, what the registry gate reads besides the entries: the catalogues, today's web routes
 *          and mobile screens, and the demo files found.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 7.3; ADR 0305 (one declaration per file).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** What the gate reads besides the entries. */
export interface RegistryCheckInput {
  /** The registry entries to check. */
  readonly entries: readonly ComponentEntry[];
  /** The parsed `showcase.json` per locale. */
  readonly catalogues: { readonly en: unknown; readonly ar: unknown };
  /** Today's web route folders (`apps/playground/src/routes/*`), shell routes included. */
  readonly webRoutes?: readonly string[];
  /** Today's mobile screens as `<tier>/<slug>` (`apps/mobile/src/screens/{free,pro}/<slug>-screen.tsx`). */
  readonly mobileScreens?: readonly string[];
  /** The demo files found per platform as `<tier>/<slug>/<id>`; omitted while no demo exists. */
  readonly demos?: { readonly react?: ReadonlySet<string>; readonly native?: ReadonlySet<string> };
}
