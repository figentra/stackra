/**
 * Stackra file contract:
 * Purpose: `CodemodFixture`, the fixture shape of one upgrade codemod: source files before and after the codemod, and
 *          the findings it must report in each.
 * Boundary: test fixture type only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0199 (Enforcement: `stackra upgrade` is tested against the codemod fixtures); STA-145.
 */

/** One codemod's fixture files. */
export type CodemodFixture = {
  /** The files. */
  readonly files: readonly {
    /** The file, relative to a workspace root; its extension picks the grammar. */
    readonly path: string;

    /** The source before the codemod. */
    readonly before: string;

    /** The source after; equal to `before` for a file the codemod must leave alone. */
    readonly after: string;

    /** The `line:column` of each finding it must report, in order. */
    readonly findings?: readonly string[];
  }[];
};
