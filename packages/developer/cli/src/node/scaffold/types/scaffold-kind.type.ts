/**
 * Stackra file contract:
 * Purpose: `ScaffoldKind`, one member kind the scaffold renders from `tools/scaffold/templates`: its template folder,
 *          its destination, the flags it takes and the runtimes it starts with.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0126 (member shapes and scaffold templates); ADR 0294; ADR 0453 (decision 11).
 */

/** One scaffold kind. */
export type ScaffoldKind = {
  /** The template folder under `tools/scaffold/templates`. */
  readonly tpl: string;

  /** The destination relative to the target repo root, from the name and the category. */
  readonly dest: (name: string, category?: string) => string;

  /** True when the kind needs `--category`. */
  readonly category?: boolean;

  /** True when the kind takes `--data`. */
  readonly data?: boolean;

  /** The `stackra.runtimes` it starts with. */
  readonly runtimes: readonly string[];

  /** The dev port range a new member takes its port from. */
  readonly ports?: readonly [number, number];

  /** True when the name may not hold a hyphen (an Android package segment). */
  readonly noHyphen?: boolean;
};
