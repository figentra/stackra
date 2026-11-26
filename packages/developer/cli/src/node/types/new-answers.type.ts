/**
 * Stackra file contract:
 * Purpose: `NewAnswers`, what `stackra new` runs with as `askNew` sees it: the kind and name, the fields it may ask
 *          for (category, area, description, summary), and those that decide what it asks (`--repo`, `--entries`,
 *          `--data`).
 * Boundary: type only; `NewCommand` builds it from its fields and hands the filled answers to `NEW_COMMAND`.
 * Runtime: node
 * Governing contract: ADR 0506; STA-2883.
 */

/** The answers of one `stackra new` run. */
export type NewAnswers = {
  /** What to create: package, service, seed-pack, tooling, app:<…> or a kind the body adds. */
  readonly kind?: string | undefined;

  /** Its kebab-case name. */
  readonly name?: string | undefined;

  /** A package's category folder under `packages/`. */
  readonly category?: string | undefined;

  /** A service's API area. */
  readonly area?: string | undefined;

  /** One sentence: the package.json description. */
  readonly description?: string | undefined;

  /** One sentence for agents: when to reach for the member. */
  readonly summary?: string | undefined;

  /** The repository folder it goes in instead of this workspace. */
  readonly repo?: string | undefined;

  /** A package's optional entries (makes it a template kind). */
  readonly entries?: string | undefined;

  /** A package with database folders (makes it a template kind). */
  readonly data?: boolean | undefined;
};
