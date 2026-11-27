/**
 * Stackra file contract:
 * Purpose: `DATA_CLASS_EFFECT_RANKS`, the order of strictness of each data-class effect, as a rank per code (0 is the
 *          loosest): `never` is stricter than `tenant_opt_in`, which is stricter than `allowed`; `delete` and `shred`
 *          rank together above `anonymise`, which is above `keep`.
 * Boundary: a frozen constant, the code floor of ADR 0380 decision 3 extended to the four effects of ADR 0540. Read by
 *           `loosenedEffects` and `strictestEffects`; a code with no rank is a programming error those functions
 *           refuse.
 * Runtime: isomorphic
 * Governing contract: ADR 0540 (decision 3); ADR 0380 (decision 3).
 */
import type { DataClassEffects } from "#core/types/data-class-effects.type";

/** Each effect's codes, ranked loosest (0) to strictest. */
export const DATA_CLASS_EFFECT_RANKS: {
  readonly [Effect in keyof DataClassEffects]: Readonly<Record<DataClassEffects[Effect], number>>;
} = Object.freeze({
  ai: Object.freeze({ allowed: 0, tenant_opt_in: 1, never: 2 }),
  support: Object.freeze({ visible: 0, hidden: 1 }),
  search: Object.freeze({ snippet: 0, no_snippet: 1 }),
  export: Object.freeze({ labelled: 0, excluded: 1 }),
  encrypt: Object.freeze({ clear: 0, sealed: 1, subject_sealed: 2 }),
  erasure: Object.freeze({ keep: 0, anonymise: 1, delete: 2, shred: 2 }),
  retention: Object.freeze({ none: 0, required: 1 }),
  mask: Object.freeze({ keep: 0, hash: 1, fake: 2, null: 3 }),
});
