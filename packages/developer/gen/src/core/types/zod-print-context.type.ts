/**
 * Stackra file contract:
 * Purpose: `ZodPrintContext`, what `zodOfJsonSchema` needs from the emitter that calls it: a way to record an import
 *          of the printed file and the zod expression of a local `$ref` target.
 * Boundary: a type only; the client emitter implements it.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 2: the manifest is the one contract source); ADR 0294 (decision 26).
 */

/** What the printer needs from the emitter that calls it. */
export interface ZodPrintContext {
  /** Records one import of the printed file. */
  readonly use: (from: string, name: string) => void;

  /** The zod expression of a `$ref` target (`#/schemas/<module>.<Name>`), or `undefined` when it is not local. */
  readonly ref: (target: string) => string | undefined;
}
