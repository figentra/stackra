/**
 * Stackra file contract:
 * Purpose: `LoadableSecretStore`, a `SecretStore` driver that reads its values in `load()` and answers `get` from
 *          that copy: `aws_secrets_manager`, `gcp_secret_manager` and `file`. `scheduleSecretReload` takes one.
 * Boundary: a type only. `load()` replaces the whole copy only when every read succeeded, so a failed reload keeps
 *           the values the last good load read.
 * Runtime: isomorphic
 * Governing contract: ADR 0371 (decision 4, amendment 2026-11-27, STA-258); ADR 0173.
 */
import type { SecretStore } from "#contracts/ports/secret-store.port";

/** A secret store that loads its values before it answers. */
export type LoadableSecretStore = SecretStore & {
  /**
   * Reads every configured secret and swaps the copy `get` answers from, in one step, when all reads succeed.
   *
   * @throws Error naming the step, status or ids that failed, never a value; the previous copy stays.
   */
  load: () => Promise<void>;
};
