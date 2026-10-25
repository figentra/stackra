/**
 * Stackra file contract:
 * Purpose: `AssuranceLevel`, how strongly a session's last authentication proved the user: one factor, two factors,
 *          or a hardware-bound key (NIST SP 800-63B AAL1 to AAL3).
 * Boundary: an `Enum.of` value plus the type of the same name, ordered weakest first so a level compares by index.
 *           Which methods reach which level, and which actions need a step-up, are configuration and rule data.
 * Runtime: isomorphic
 * Governing contract: ADR 0207 (decision 1: the AAL in the token, step-up for L3 and L4); ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";

/** The assurance levels, weakest first. */
export const AssuranceLevel = Enum.of({
  /** One factor (a password or a passkey-less code). */
  Aal1: "aal1",
  /** Two factors, or a phishing-resistant authenticator. */
  Aal2: "aal2",
  /** A hardware-bound key. */
  Aal3: "aal3",
});

/** One of the codes above. */
export type AssuranceLevel = Enum.Value<typeof AssuranceLevel>;
