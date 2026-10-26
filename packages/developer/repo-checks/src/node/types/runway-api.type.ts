/**
 * Stackra file contract:
 * Purpose: `RunwayApi`, the three names of the built `@stackra/runway` entry the runway-file check calls. The check
 *          loads that entry at run time, so this structural type stands in for an import of the package.
 * Boundary: type only; `checkRunwayFiles` receives a value of it, so tests pass a fake.
 * Runtime: node
 * Governing contract: ADR 0296 (runway files are checked against their kind's schema).
 */

/** The `@stackra/runway` functions the runway-file check uses. */
export type RunwayApi = {
  /** Parses one runway document as `kind`; throws `RunwayInvalidError` with its issues. */
  readonly parseRunway: (kind: string, document: unknown, file: string) => unknown;

  /** The error `parseRunway` throws for a document that breaks the schema. */
  readonly RunwayInvalidError: new (...args: never[]) => Error & {
    /** Each schema issue: the document path and its message. */
    readonly issues: readonly { readonly path: string; readonly message: string }[];
  };

  /** The placement problems of a parsed root runway against the service member keys. */
  readonly checkPlacement: (
    root: unknown,
    services: readonly string[],
  ) => readonly { readonly code: string; readonly message: string }[];
};
