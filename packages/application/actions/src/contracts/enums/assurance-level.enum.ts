/**
 * Stackra file contract:
 * Purpose: `AssuranceLevel`, how strongly a session's last authentication proved the user (NIST SP 800-63B AAL1 to
 *          AAL3), as the pipeline's step-up option names it: `Action({ stepUp: AssuranceLevel.Aal2 })`.
 * Boundary: an `Enum.of` value plus the type of the same name, weakest first. The codes are exactly those of
 *           `@stackra/identity`'s `AssuranceLevel` (that package maps authentication methods to a level from its
 *           configuration), so either enum's value fits the other's type; this one lives here because @stackra/actions
 *           depends on neither identity nor iam. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0207 (decision 1: step-up for L3 and L4); ADR 0406 (the step-up option); STA-814.
 */
import { Enum } from "@stackra/contracts";

/**
 * The assurance levels, weakest first.
 *
 * @example
 * export class RotateKeyAction extends Action({ key: "api_key.rotate", actors: [ActorKind.User], stepUp: AssuranceLevel.Aal2 }) {}
 */
export const AssuranceLevel = Enum.of({
  /** One factor. */
  Aal1: "aal1",
  /** Two factors, or a phishing-resistant authenticator. */
  Aal2: "aal2",
  /** A hardware-bound key. */
  Aal3: "aal3",
});

/** One of the codes above. */
export type AssuranceLevel = Enum.Value<typeof AssuranceLevel>;
