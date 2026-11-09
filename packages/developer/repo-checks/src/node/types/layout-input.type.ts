/**
 * Stackra file contract:
 * Purpose: `LayoutInput`, what the layout check compares: the repository's root entries and paths, its preset, its
 *          member folders and the differences it declares.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0526 (decision 4).
 */

/** One repository, as the layout check sees it. */
export type LayoutInput = {
  /** The first path segment of every listed file, once each. */
  readonly entries: readonly string[];

  /** Every listed file, repository-relative. */
  readonly paths: readonly string[];

  /** The Flow preset from flow.config.json, which names the template. */
  readonly preset: string;

  /** The root folders `pnpm-workspace.yaml` takes members from. */
  readonly members: readonly string[];

  /** package.json `stackra.layout.allow`: an extra root entry and the reason it is there. */
  readonly allow: Readonly<Record<string, string>>;

  /** package.json `stackra.layout.banned`: retired names no path may carry, compared without case. */
  readonly banned: readonly string[];

  /** Whether `tools/README.md` exists. */
  readonly toolsReadme: boolean;
};
