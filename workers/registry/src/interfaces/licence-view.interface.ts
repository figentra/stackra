/**
 * Stackra file contract:
 * Purpose: `LicenceView`: the licence behind a token, as the registry needs it.
 * Boundary: the port and its empty binding only. The D1 adapter over `licences`, `licence_grants` and
 *           `licence_tokens` is stackra-183's (workers/registry licence folder); the read rule over the result is
 *           `readAccess`'s.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 10 and 13); stackra-183 (STA-1335).
 */
import type { LicenceGrantView } from "#src/interfaces/licence-grant-view.interface";

/** The licence behind a token, as the registry needs it. */
export interface LicenceView {
  /** The id of the licence the token belongs to. */
  readonly licenceId: string;
  /** The id of the token that presented the licence. */
  readonly tokenId: string;
  /** The opaque customer reference in Figentra OS (the `whoami` answer). */
  readonly holder: string;
  /** Whether the licence is active, suspended or revoked. */
  readonly status: "active" | "suspended" | "revoked";
  /** The time before which the licence grants nothing, or null when it starts at once. */
  readonly notBefore: string | null;
  /** When the licence ends, or null when it never ends. */
  readonly expiresAt: string | null;
  /** The scopes and names the licence may read. */
  readonly grants: readonly LicenceGrantView[];
}
