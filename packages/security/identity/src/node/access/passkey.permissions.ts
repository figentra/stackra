/**
 * Stackra file contract:
 * Purpose: `PasskeyPermissions`, the permissions of a passkey: `identity.passkey.<verb>`, each with its risk.
 *          `challenge` and `verify` are what the anonymous sign-in actions derive, `register` and `confirm` what the
 *          signed-in registration actions derive, so gen's `permission_unknown` passes.
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static. The sign-in pair runs in the public area: the challenge is a write (L2)
 *           and the verify mints a session (L4, STA-2096); only a passkey the provider verifies gets past it.
 *           Starting a registration is a write (L2); keeping the new passkey adds a key to the account (L4).
 * Runtime: isomorphic
 * Governing contract: ADR 0462; ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); STA-1538.
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * The passkey verbs.
 *
 * @example
 * export class ChallengePasskeyAction extends Action({ key: "passkey.challenge", area: ApiArea.Public, ... }) {}
 */
export class PasskeyPermissions extends Permissions {
  /** Start a passkey sign-in for a login name; L2 (a write), public. */
  static readonly challenge = Permission.L2;

  /** Check a passkey sign-in; L4, public, as it mints a session (STA-2096); the provider verifies the signature. */
  static readonly verify = Permission.L4;

  /** Start adding a passkey to one's own account; L2, as nothing is kept until `confirm`. */
  static readonly register = Permission.L2;

  /** Keep a new passkey on one's own account; L4, as it adds a key, a new way in (STA-2096). */
  static readonly confirm = Permission.L4;
}
