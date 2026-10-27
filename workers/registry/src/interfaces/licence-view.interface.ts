/**
 * Stackra file contract:
 * Purpose: `LicenceView`: the licence behind a token, as the registry needs it.
 * Boundary: type only. `D1LicenceCheck` (src/licence) builds it from `licences`, `licence_grants` and
 *           `licence_tokens`; the read rule over it is `readAccess`'s.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 10 and 13); ADR 0461 (decision 3); stackra-183 (STA-1335).
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
  /** Whether it is one of Figentra's own licences, the only ones that read an `internal` name (ADR 0461 d3). */
  readonly internal: boolean;
}
