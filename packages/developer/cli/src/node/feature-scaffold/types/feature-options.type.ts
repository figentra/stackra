/**
 * Stackra file contract:
 * Purpose: `FeatureOptions`, the input of `scaffoldFeature`: the kind and name, where to run, and the flags of
 *          `stackra new` for the feature kinds.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); ADR 0294 (the v3 groups).
 */

/** What `scaffoldFeature` writes. */
export type FeatureOptions = {
  /** One of `FEATURE_KINDS`. */
  readonly kind: string;

  /** The kebab-case name: the module key, the model, the migration, or `<verb>-<model>` for an action or query. */
  readonly name: string;

  /** Where the command runs; the service is the nearest one at or above it. */
  readonly cwd: string;

  /** `--member`: the service folder, relative to `cwd`. */
  readonly member?: string | undefined;

  /** `--module`: the module folder under `src/modules/` (every kind but `module`). */
  readonly module?: string | undefined;

  /** `--model`: the model (a module's first model, or the one an action, query or migration is about). */
  readonly model?: string | undefined;

  /** `--fields`: `<name>:<type>[?]`, comma-separated. */
  readonly fields?: string | undefined;

  /** `--prefix`: the new model's public id prefix. */
  readonly prefix?: string | undefined;

  /** `--global`: the new model is global by design (`Model.global`), not tenant-owned. */
  readonly global?: boolean | undefined;

  /** `--table`: the table a migration alters, when it is not a model's of the module. */
  readonly table?: string | undefined;

  /** `--dry-run`: list the files without writing them. */
  readonly dryRun?: boolean | undefined;

  /** False skips formatting the written files with the workspace's oxfmt (true by default). */
  readonly format?: boolean | undefined;
};
