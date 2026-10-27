/**
 * Stackra file contract:
 * Purpose: `TsType`, the opaque checker type a `TsHost` hands out and reads back.
 * Boundary: a type only; branded so a type never passes as a symbol. Only the host that made one reads it.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 26: one host seam over the TypeScript 7 API with a TypeScript 6 fallback);
 *                     ADR 0305 (rules 42 and 45).
 */
/** An opaque checker type. */
export type TsType = {
  /** The brand that keeps a type from passing as a symbol. */
  readonly "~tsType": true;
};
