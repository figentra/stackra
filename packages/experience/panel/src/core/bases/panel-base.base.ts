/**
 * Stackra file contract:
 * Purpose: `PanelBase`, the instance side of a panel: the class `Panel({ path, area })` in `panel.base.ts` hands to `createKind`, so every
 *          `Panel(...)` class extends it.
 * Boundary: the instance base only; the kind brand is type-only. The called form, its option checks and its key live in
 *           `panel.base.ts`; the entry exports this class as a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0164 (decision 3); ADR 0294 (decisions 16 and 20); ADR 0305 (rules 10 to 13 and 43).
 */
/** The instance side of a panel: data only, so nothing beyond the kind brand. */
export abstract class PanelBase {
  /** Type-only kind brand, so a class of another kind cannot stand in for a panel. */
  declare protected readonly "~kind": "panel";
}
