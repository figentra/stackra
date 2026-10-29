/**
 * Stackra file contract:
 * Purpose: `ChallengePasskeyAction`, `identity.passkey.challenge@1`: starts a passkey sign-in for a login name at the
 *          identity provider and answers the provider's session with the WebAuthn options the device signs;
 *          `POST /passkeys/challenge`, the `api.passkeyChallenge` of the app's sign-in screen.
 * Boundary: anonymous, in the public API area with its own small bucket against login-name probing. Opens a provider
 *           session through `IdpAdmin`; an unknown login is `UnauthenticatedError`. Not an MCP tool.
 * Runtime: node
 * Governing contract: ADR 0206 (decision 8); ADR 0462; ADR 0294 (decisions 16 and 21); ADR 0082; STA-1538.
 */
import { Action } from "@stackra/actions";
import { ActorKind, ApiArea } from "@stackra/contracts";

import type { IdpAdmin } from "#contracts/index";
import type { ChallengePasskeyInput } from "#node/schemas/challenge-passkey-input.schema";
import { ChallengePasskeyOutput } from "#node/schemas/challenge-passkey-output.schema";

/**
 * Starts a passkey sign-in.
 *
 * @example
 * const { sessionId, options } = await pipeline.execute(ChallengePasskeyAction, { loginName: "rana" }, { actor });
 */
export class ChallengePasskeyAction extends Action({
  key: "passkey.challenge",
  actors: [ActorKind.Anonymous],
  area: ApiArea.Public,
  rateLimit: { perMinute: 10 },
  // reason: signing a person in is the device's, never an agent's
  tool: false,
}) {
  /** The identity provider. */
  private readonly idp: IdpAdmin;

  /**
   * @param idp - opens the provider session with its challenge.
   */
  constructor(idp: IdpAdmin) {
    super();
    this.idp = idp;
  }

  /** Opens the provider session and answers its challenge. */
  async handle(input: ChallengePasskeyInput): Promise<ChallengePasskeyOutput> {
    return ChallengePasskeyOutput.create(await this.idp.startPasskeySignIn(input.loginName));
  }
}
