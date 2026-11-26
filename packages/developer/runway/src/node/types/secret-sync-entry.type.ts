/**
 * Stackra file contract:
 * Purpose: `SecretSyncEntry`, one member's secret names in a secret sync of one environment: the sops scope that
 *          holds them, which runtime they go to and who writes them.
 * Boundary: type only; names only, never a value.
 * Runtime: node
 * Governing contract: ADR 0525 (sops scopes); STA-606.
 */

/** One member's secrets in a secret sync. */
export type SecretSyncEntry = {
  /** The member folder name. */
  readonly member: string;

  /** Its folder from the repository root (`services/api`). */
  readonly folder: string;

  /** The secret names it declares for the environment, top level and per environment, sorted. */
  readonly names: readonly string[];

  /** The figentra/secrets scope that holds them (`products/acme/staging`), or null when the root names no `project`. */
  readonly scope: string | null;

  /**
   * Who writes them: `encore` (the sync, `encore secret set`), `cloudflare-workers` (the Workers provider at deploy),
   * `eas` (not yet: STA-2009) or `none` (no runtime takes a secret from this member).
   */
  readonly writer: "encore" | "cloudflare-workers" | "eas" | "none";
};
