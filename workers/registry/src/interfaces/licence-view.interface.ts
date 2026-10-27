/**
 * Stackra file contract:
 * Purpose: `LicenceView`: the licence behind a token, as the registry needs it.
 * Boundary: the port and its empty binding only. The D1 adapter over `licences`, `licence_grants` and
 *           `licence_tokens` is stackra-183's (workers/registry licence folder); the read rule over the result is
 *           `readAccess`'s.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 10 and 13); stackra-183 (STA-1335).
 */
import type { LicenceGrantView } from "#src/interfaces/licence-grant-view.interface";

/** The licence behind a token, as the registry needs it. */
export interface LicenceView {
  readonly licenceId: string;
  readonly tokenId: string;
  /** The opaque customer reference in Figentra OS (the `whoami` answer). */
  readonly holder: string;
  readonly status: "active" | "suspended" | "revoked";
  readonly notBefore: string | null;
  readonly expiresAt: string | null;
  readonly grants: readonly LicenceGrantView[];
}
