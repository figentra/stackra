/**
 * Stackra file contract:
 * Purpose: `SecretSyncEntry`, one member's secret names in a secret sync of one environment: where Infisical holds
 *          them, which runtime they go to and who writes them.
 * Boundary: type only; names only, never a value.
 * Runtime: node
 * Governing contract: ADR 0173; ADR 0512 (`/runtime/<member>`); STA-606.
 */

/** One member's secrets in a secret sync. */
export type SecretSyncEntry = {
  /** The member folder name. */
  readonly member: string;

  /** Its folder from the repository root (`services/api`). */
  readonly folder: string;

  /** The secret names it declares for the environment, top level and per environment, sorted. */
  readonly names: readonly string[];

  /** The Infisical folder that holds them (`/runtime/api`), or null when the root runway names no runtime path. */
  readonly path: string | null;

  /**
   * Who writes them: `encore` (the sync, `encore secret set`), `cloudflare-workers` (the Workers provider at deploy),
   * `eas` (not yet: STA-2009) or `none` (no runtime takes a secret from this member).
   */
  readonly writer: "encore" | "cloudflare-workers" | "eas" | "none";
};
