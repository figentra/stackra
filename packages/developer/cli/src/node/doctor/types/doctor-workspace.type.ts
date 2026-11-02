/**
 * Stackra file contract:
 * Purpose: `DoctorWorkspace`, what `doctorNeeds` reads about a workspace: its package.json files, root scripts, root
 *          runway, whether it uses Infisical and its members' dev ports. `readDoctorWorkspace` fills it from disk;
 *          `stackra create` can fill it from a starter before writing.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: STA-1952 spec FR-015.
 */

/** A workspace as the doctor sees it. */
export type DoctorWorkspace = {
  /** The root's and each member's package.json, as parsed. */
  readonly manifests: readonly unknown[];

  /** The root package.json scripts. */
  readonly scripts: Readonly<Record<string, unknown>>;

  /** The root runway.yaml, as parsed, when there is one. */
  readonly runway?: unknown;

  /** Whether the root holds `.infisical.yaml`. */
  readonly infisical: boolean;

  /** Each member's `environments.dev.port` from its runway.yaml. */
  readonly devPorts: readonly number[];
};
