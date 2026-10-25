/**
 * Stackra file contract:
 * Purpose: `TemplateFile`, one file `stackra new` writes: its path relative to the new folder and its content.
 * Boundary: type only; the template functions build them, `NEW_COMMAND` writes them.
 * Runtime: node
 * Governing contract: ADR 0282 (consequences: `new` moves into the CLI); ADR 0294 (rule R12); ADR 0295.
 */

/** One file of a template. */
export type TemplateFile = {
  /** The path inside the new folder, `/`-separated. */
  readonly path: string;

  /** The full text. */
  readonly content: string;
};
