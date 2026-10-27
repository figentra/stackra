/**
 * Stackra file contract:
 * Purpose: `DocumentBase`, the instance side of a document: the class `Document({ kind, ... })` in `document.base.ts` hands to `createKind`, so every
 *          `Document(...)` class extends it.
 * Boundary: the instance base only; the kind brand is type-only. The called form, its option checks and its key live in
 *           `document.base.ts`; the entry exports this class as a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 20); ADR 0294 (decisions 16 and 20); ADR 0305 (rules 10 to 13 and 43).
 */
/** The instance side of a document: data only, so nothing beyond the kind brand. */
export abstract class DocumentBase {
  /** Type-only kind brand, so a class of another kind cannot stand in for a document. */
  declare protected readonly "~kind": "document";
}
