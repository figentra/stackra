/**
 * Stackra file contract:
 * Purpose: `TsSymbol`, the opaque checker symbol a `TsHost` hands out and reads back.
 * Boundary: a type only; branded so a symbol never passes as a type. Only the host that made one reads it.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 26: one host seam over the TypeScript 7 API with a TypeScript 6 fallback);
 *                     ADR 0305 (rules 42 and 45).
 */
/** An opaque checker symbol. */
export type TsSymbol = {
  /** The brand that keeps a symbol from passing as a type. */
  readonly "~tsSymbol": true;
};
