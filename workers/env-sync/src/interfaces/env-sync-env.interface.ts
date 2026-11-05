/**
 * Stackra file contract:
 * Purpose: the Worker's environment: the two secrets and the routes setting, all as strings the way wrangler hands
 *          `vars` and secrets in.
 * Boundary: types only; handle-request.ts reads and checks them.
 * Runtime: worker
 * Governing contract: ADR 0173 (amendment of 2026-11-04, decision 6).
 */

/** What wrangler.jsonc binds and runway puts as Worker secrets. */
export interface EnvSyncEnv {
  /** Worker secret: the key Infisical signs its webhook with. Unset: every request gets 401. */
  readonly INFISICAL_WEBHOOK_SECRET?: string | undefined;
  /** Worker secret: a GitHub token that may dispatch each routed repository's env-sync.yml. Unset: 503. */
  readonly ENV_SYNC_GITHUB_TOKEN?: string | undefined;
  /** JSON object of Infisical project id to "owner/repo". Invalid: 503. */
  readonly ENV_SYNC_ROUTES?: string | undefined;
}
