/**
 * Stackra file contract:
 * Purpose: `KindFolder`, one pre-v3 kind folder under `src/` (ADR 0126 d3, 0128 d4, 0130): the folder, the file kind
 *          suffix and the test tier a file of that kind requires.
 * Boundary: type only; `KIND_FOLDERS`, `ROOT_MODULE` and `REACT_HOOK` are its values.
 * Runtime: node
 * Governing contract: ADR 0126; ADR 0128; ADR 0130.
 */

/** A kind folder and the file kind it holds. */
export type KindFolder = {
  /** The folder name under `src/`, or `null` when the kind has no folder of its own. */
  readonly folder: string | null;

  /** The file kind (`<subject>.<suffix>.ts`), or `null` when files carry no kind suffix. */
  readonly suffix: string | null;

  /** The required test tier, or `null` when none is required. */
  readonly test: string | null;

  /** One line saying why the rule exists. */
  readonly reason: string;

  /** The ADR or settlement item it comes from. */
  readonly adr: string;
};
