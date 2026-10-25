/**
 * Stackra file contract:
 * Purpose: `InstallableModule`, one module as the install planner reads it from the released manifests: its key, the
 *          modules it depends on, and the modules it only enhances.
 * Boundary: a type only; a `CatalogueManifest` module entry fits it (`enhances` is an open field there until the
 *           manifest schema names it).
 * Runtime: isomorphic
 * Governing contract: ADR 0214 (decision 3: `dependsOn` is resolved); ADR 0350 (decision 4: `enhances`).
 */

/** One module of the catalogue. */
export interface InstallableModule {
  /** The module key. */
  readonly key: string;

  /** The modules it needs installed first. */
  readonly dependsOn: readonly string[];

  /** The modules it only enhances; it installs without them. */
  readonly enhances?: readonly string[];
}
