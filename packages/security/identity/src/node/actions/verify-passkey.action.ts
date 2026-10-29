/**
 * Stackra file contract:
 * Purpose: `VerifyPasskeyAction`, `identity.passkey.verify@1`: checks the device's signed credential against the
 *          challenge's provider session and answers the verified session; `POST /passkeys/verify`, the
 *          `api.passkeyVerify` of the app's sign-in screen.
 * Boundary: anonymous, in the public API area with its own small bucket. The provider verifies the signature; a refused
 *           credential or a gone session is `UnauthenticatedError`. The answer's token is a bearer secret the host's
 *           BFF turns into its own session (finishing the OIDC auth request) and never logs. Not an MCP tool.
 * Runtime: node
 * Governing contract: ADR 0206 (decisions 7 and 8); ADR 0462; ADR 0294 (decisions 16 and 21); ADR 0082; STA-1538.
 */
import { Action } from "@stackra/actions";
import { ActorKind, ApiArea } from "@stackra/contracts";

import type { IdpAdmin } from "#contracts/index";
import type { VerifyPasskeyInput } from "#node/schemas/verify-passkey-input.schema";
import { VerifyPasskeyOutput } from "#node/schemas/verify-passkey-output.schema";

/**
 * Checks a passkey sign-in.
 *
 * @example
 * const { sessionId, sessionToken } = await pipeline.execute(VerifyPasskeyAction, { sessionId, credential }, { actor });
 */
export class VerifyPasskeyAction extends Action({
  key: "passkey.verify",
  actors: [ActorKind.Anonymous],
  area: ApiArea.Public,
  rateLimit: { perMinute: 10 },
  // reason: signing a person in is the device's, never an agent's
  tool: false,
}) {
  /** The identity provider. */
  private readonly idp: IdpAdmin;

  /**
   * @param idp - checks the credential on the provider session.
   */
  constructor(idp: IdpAdmin) {
    super();
    this.idp = idp;
  }

  /** Checks the credential and answers the verified session. */
  async handle(input: VerifyPasskeyInput): Promise<VerifyPasskeyOutput> {
    return VerifyPasskeyOutput.create(
      await this.idp.finishPasskeySignIn(input.sessionId, input.credential),
    );
  }
}
