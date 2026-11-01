/**
 * Stackra file contract:
 * Purpose: `SpecTask`, one task line of a spec's tasks.md.
 * Boundary: type only; `specParseTasks` builds it.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */

/** A `- [ ] T001 …` line with the fields the gates read. */
export type SpecTask = {
  /** The 1-based line in tasks.md. */
  readonly line: number;

  /** The task id (`T001`). */
  readonly id: string;

  /** True when the box is ticked. */
  readonly done: boolean;

  /** True when the id is struck through (`~~T001~~`). */
  readonly struck: boolean;

  /** True for a `[P]` (parallel) task. */
  readonly parallel: boolean;

  /** The requirement and property ids after `covers:`. */
  readonly covers: readonly string[];

  /** The task type after `route:`, when given. */
  readonly route: string | undefined;

  /** The task ids after `deps:`. */
  readonly deps: readonly string[];

  /** Every backtick-quoted path in the line. */
  readonly paths: readonly string[];

  /** The trailing issue key tag (`[OS-12]`), when given. */
  readonly key: string | undefined;

  /** The `##` heading the task sits under. */
  readonly phase: string;
};
