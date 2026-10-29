/**
 * Stackra file contract:
 * Purpose: `LineSource`, where a template line's release comes from: the registry scope its packages are published
 *          under and, for local development and the line test set, a local checkout of the line instead.
 * Boundary: type only; `checkoutLine` and `runMobileJob` take it. The scope is passed in by the deploy workflow, so
 *           Runway names no owner's scope itself (ADR 0441 decision 5); the registry is the product checkout's
 *           `.npmrc` mapping for that scope.
 * Runtime: node
 * Governing contract: ADR 0481 (template lines release as registry packages); ADR 0436 (decision 6: a local OS
 *                     checkout).
 */

/** Where a line's release is fetched from. */
export type LineSource = {
  /** The npm scope the lines are published under, `@figentra`; `os/mobile@3` is `<scope>/os-mobile@3.x`. */
  readonly scope: string;
  /** A local folder holding the line's package instead of the registry: `<folder>/package.json` is its package. */
  readonly local?: string;
  /** The folder `npm` runs in, so its `.npmrc` maps the scope to the registry; the working directory when absent. */
  readonly cwd?: string;
};
