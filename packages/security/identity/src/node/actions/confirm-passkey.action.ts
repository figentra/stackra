/**
 * Stackra file contract:
 * Purpose: `ConfirmPasskeyAction`, `identity.passkey.confirm@1`: hands the device's new credential to the identity
 *          provider to check and keep on the caller's own account under a name; `POST /passkeys/confirm`.
 * Boundary: a signed-in user only, for their own account (found by the actor's `usr_` id). The provider checks the
 *           attestation and that the passkey is the caller's pending one; a refusal is `UnauthenticatedError`. The
 *           audit entry names the passkey, not the credential. Not an MCP tool.
 * Runtime: node
 * Governing contract: ADR 0206 (decision 8); ADR 0462; ADR 0294 (decisions 16 and 21); STA-1538.
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { UnauthenticatedError } from "@stackra/errors";

import type { IdpAdmin } from "#contracts/index";
import type { ConfirmPasskeyInput } from "#node/schemas/confirm-passkey-input.schema";
import { ConfirmPasskeyOutput } from "#node/schemas/confirm-passkey-output.schema";

/**
 * Keeps a new passkey on the caller's account.
 *
 * @example
 * await pipeline.execute(ConfirmPasskeyAction, { passkeyId, name: "iPhone", credential }, { actor });
 */
export class ConfirmPasskeyAction extends Action({
  key: "passkey.confirm",
  actors: [ActorKind.User],
  // reason: a passkey is created on the person's own device, never by an agent
  tool: false,
}) {
  /** The identity provider. */
  private readonly idp: IdpAdmin;

  /**
   * @param idp - finds the caller's provider user and checks the credential.
   */
  constructor(idp: IdpAdmin) {
    super();
    this.idp = idp;
  }

  /** Checks and keeps the passkey. */
  async handle(input: ConfirmPasskeyInput, ctx: ActionContext): Promise<ConfirmPasskeyOutput> {
    const userId = await this.idp.findUserId(ctx.actor.id);
    if (userId === undefined) throw UnauthenticatedError.create();
    await this.idp.finishPasskeyRegistration(userId, input.passkeyId, input.credential, input.name);
    ctx.audit({ passkeyId: input.passkeyId });
    return ConfirmPasskeyOutput.create({ passkeyId: input.passkeyId });
  }
}
