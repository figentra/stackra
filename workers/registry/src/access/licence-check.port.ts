/**
 * Stackra file contract:
 * Purpose: `LicenceCheck`: reads a licence token.
 * Boundary: the port only. The D1 adapter is `D1LicenceCheck` (src/licence); tests use `MemoryLicenceCheck`; the
 *           read rule over the result is `readAccess`'s.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 10 and 13); stackra-183 (STA-1335).
 */
import type { LicenceView } from "#src/interfaces/licence-view.interface";

/** Reads a licence token. */
export interface LicenceCheck {
  /** The licence of a token, or null when the token is unknown or revoked. */
  check: (token: string) => Promise<LicenceView | null>;
}
