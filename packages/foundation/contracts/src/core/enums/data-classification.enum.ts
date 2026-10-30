/**
 * Stackra file contract:
 * Purpose: the classes of personal and regulated data a field or a logged call may declare with `@Classified(...)`;
 *          export, erasure and the access log read them.
 * Boundary: an `Enum.of` value plus the type of the same name, so a call site writes
 *           `DataClassification.Personal`, never a bare string. The code is the stored value.
 * Runtime: isomorphic
 * Governing contract: ADR 0134 (classification), ADR 0294 (decision 16 and amendment R6: `@Classified`), ADR 0231
 *                     (snake_case codes); STA-1237 (`regulated`, OS tenancy gap G6); ADR 0494 (`credential`).
 */
import { Enum } from "#core/bases/enum.base";

/** The six classes of personal and regulated data; a field that holds none carries no `@Classified`. */
export const DataClassification = Enum.of({
  /** Identifies a person directly: a name, an email address, a phone number. */
  Personal: "personal",
  /** Money held or owed by a person: balances, payment details. */
  Financial: "financial",
  /** Health data, a special category. */
  Health: "health",
  /** Points to a person only through another table: a principal id, a member id. */
  Pseudonymous: "pseudonymous",
  /** Identifiers a regulator issues or governs: a tax registration number, a national id, a trade licence. */
  Regulated: "regulated",
  /** A provider secret: an OAuth token, a client secret, an API key, a PKCE verifier, a webhook signing secret. Never exported or answered to a subject, skipped by erasure, always access-logged. */
  Credential: "credential",
});

/** One of the codes above. */
export type DataClassification = Enum.Value<typeof DataClassification>;
