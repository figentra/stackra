/**
 * Stackra file contract:
 * Purpose: `BlockBase`, the instance side of a page-builder block: the class `Block({ category, icon })` in `block.base.ts` hands to `createKind`, so every
 *          `Block(...)` class extends it.
 * Boundary: the instance base only; the kind brand is type-only. The called form, its option checks and its key live in
 *           `block.base.ts`; the entry exports this class as a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 25); ADR 0305 (rules 2, 3, 10 to 13 and 43); ADR 0270 (decisions 3 and 6).
 */
/** The instance side every block shares. */
export abstract class BlockBase {
  /** Type-only kind brand; protected, so it is not in `keyof` and never counts as a prop. */
  declare protected readonly "~kind": "block";
}
