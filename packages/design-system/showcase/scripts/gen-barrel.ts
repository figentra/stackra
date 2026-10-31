/**
 * Stackra file contract:
 * Purpose: `genBarrel`: the source of `src/registry/components.generated.ts`, the registry barrel Metro needs because
 *          it has no glob: imports sorted by constant, `COMPONENTS` in listing order, module kit entries inlined.
 * Boundary: a pure function over the loaded entries (`loadEntries`); gen.ts writes what it returns.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 2; ADR 0503.
 */
import type { ComponentEntry } from "../src/types/component-entry.type.ts";
import type { LoadedEntry } from "./loaded-entry.type.ts";

/** The barrel source; `compare` is `compareEntries`. */
export function genBarrel(
  loaded: readonly LoadedEntry[],
  compare: (a: ComponentEntry, b: ComponentEntry) => number,
): string {
  const imports = loaded
    .toSorted((a, b) => (a.constant < b.constant ? -1 : 1))
    .flatMap(({ constant, module }) =>
      module ? [`import { ${constant} } from "${module}";`] : [],
    );
  // a kit entry is inlined: the showcase never imports a module package (ADR 0503)
  const listed = loaded
    .toSorted((a, b) => compare(a.entry, b.entry))
    .map(({ constant, module, entry }) =>
      module
        ? `  ${constant},`
        : `  // ${constant}: ${entry.packageName}, from its showcase/${entry.slug}.json\n  ${JSON.stringify(entry)},`,
    );
  return [
    "/**",
    " * Stackra file contract:",
    " * Purpose: `COMPONENTS`, every registry entry in listing order (category, tier, slug). Metro has no glob, so",
    " *          the entry files are imported one by one.",
    " * Boundary: GENERATED from `src/registry/components/<tier>/<slug>.ts` and the module kits'",
    " *           `packages/<category>/<name>/showcase/<slug>.json` (gen-barrel, ADR 0503); do not edit by hand.",
    " * Runtime: isomorphic",
    " * Governing contract: showcase redesign spec (2026-10-27) section 2.",
    " */",
    ...imports,
    'import type { ComponentEntry } from "#src/types/component-entry.type";',
    "",
    "/** Every component entry, in listing order. */",
    "export const COMPONENTS: readonly ComponentEntry[] = Object.freeze([",
    ...listed,
    "]);",
    "",
  ].join("\n");
}
