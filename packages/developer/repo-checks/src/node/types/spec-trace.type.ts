/**
 * Stackra file contract:
 * Purpose: `SpecTrace`, the trace matrix of one spec: each live FR and P with its tasks and covering tests, each SC with its method.
 * Boundary: type only; `specTrace` builds it.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */

/** The matrix `stackra check` and `spec-trace trace` read. */
export type SpecTrace = {
  /** The issue number of the spec folder (`163`), or undefined when the folder is not a spec folder. */
  readonly key: string | undefined;

  /** Each live FR. */
  readonly frs: readonly {
    readonly id: string;
    readonly tasks: readonly string[];
    readonly tested: boolean;
    readonly via: readonly string[];
  }[];

  /** Each property (P-###). */
  readonly ps: readonly {
    readonly id: string;
    readonly tasks: readonly string[];
    readonly tested: boolean;
  }[];

  /** Each live SC with the method after `verified by:`. */
  readonly scs: readonly { readonly id: string; readonly method: string | undefined }[];

  /** Each acceptance criterion (AC-###, ADR 0502) with its tasks and whether a test `@covers` it. */
  readonly acs: readonly {
    readonly id: string;
    readonly tasks: readonly string[];
    readonly tested: boolean;
  }[];
};
