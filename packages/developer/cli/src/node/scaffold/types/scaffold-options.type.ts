/**
 * Stackra file contract:
 * Purpose: `ScaffoldOptions`, the input of `scaffold`: the kind and name, the target repo, and the flags of
 *          `stackra new` for the template kinds.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0126 (member shapes and scaffold templates); ADR 0294; ADR 0453 (decision 11).
 */

/** What `scaffold` renders. */
export type ScaffoldOptions = {
  /** One of `SCAFFOLD_KINDS`. */
  readonly kind: string;

  /** The kebab-case member name. */
  readonly name: string;

  /** The target repo root; the repo holding the templates by default. */
  readonly root?: string | undefined;

  /** The repo holding `tools/scaffold/templates` and the fallback LICENSE; the workspace around the cwd by default. */
  readonly home?: string | undefined;

  /** The `packages/<category>` folder of a package. */
  readonly category?: string | undefined;

  /** The optional package entries: an array, a comma list or `none`. */
  readonly entries?: string | readonly string[] | undefined;

  /** True adds the module's database folders to a package. */
  readonly data?: boolean | undefined;

  /** One sentence: the package.json description. */
  readonly description?: string | undefined;

  /** One sentence for agents on when to reach for the member. */
  readonly summary?: string | undefined;

  /** Extra npm keywords: an array or a comma list. */
  readonly keywords?: string | readonly string[] | undefined;

  /** The display title; title case of the name by default. */
  readonly title?: string | undefined;

  /** The dev port; the next free one of the kind's range by default. */
  readonly port?: number | undefined;

  /** True lists the files without writing them. */
  readonly dryRun?: boolean | undefined;

  /** False skips formatting the new member with oxfmt. */
  readonly format?: boolean | undefined;
};
