/**
 * Stackra file contract:
 * Purpose: `DoctorWorkspace`, what `doctorNeeds` reads about a workspace: its package.json files, root scripts, root
 *          runway, its members' dev ports and the gateway port (the lane applied to both). `readDoctorWorkspace` fills
 *          it from disk;
 *          `stackra create` can fill it from a starter before writing.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: STA-1952 spec FR-015; ADR 0296 (decision 1: lanes); STA-2840.
 */

/** A workspace as the doctor sees it. */
export type DoctorWorkspace = {
  /** The root's and each member's package.json, as parsed. */
  readonly manifests: readonly unknown[];

  /** The root package.json scripts. */
  readonly scripts: Readonly<Record<string, unknown>>;

  /** The root runway.yaml, as parsed, when there is one. */
  readonly runway?: unknown;

  /** Each member's `environments.dev.port` from its runway.yaml, the dev lane applied. */
  readonly devPorts: readonly number[];

  /** The port `encore run` serves on (`environments.dev.infra.gateway.port`, the lane applied); 4000 when unset. */
  readonly gatewayPort?: number | undefined;
};
