/**
 * Stackra file contract:
 * Purpose: `ShowcaseCoverageInput`, what `findShowcaseMisses` reads: the entries, the two catalogues and the
 *          playground's route, demo and test names.
 * Boundary: a type; the script reads the folders and builds it.
 * Runtime: node
 * Governing contract: STA-2738 (the `showcase:coverage` script), a child of STA-2705.
 */
import type { ComponentEntry } from "../src/types/component-entry.type.ts";

export interface ShowcaseCoverageInput {
  readonly entries: readonly ComponentEntry[];
  readonly catalogues: { readonly en: unknown; readonly ar: unknown };
  /** The folder names under `apps/playground/src/routes` (`button`, `pro-kanban`). */
  readonly routes: ReadonlySet<string>;
  /** `<tier>/<slug>` for every folder under `apps/playground/src/demos` that holds a demo file. */
  readonly demos: ReadonlySet<string>;
  /** The slugs with a test: a `@stackra/ui` react component test folder, or a playground `<slug>.e2e.test.ts`. */
  readonly tests: ReadonlySet<string>;
}
