/**
 * Stackra file contract:
 * Purpose: `RegisterPasskeyAction`, `identity.passkey.register@1`: starts adding a passkey to the caller's own account
 *          at the identity provider and answers the WebAuthn creation options the device answers;
 *          `POST /passkeys/register`.
 * Boundary: a signed-in user only, for their own account: the provider's user is found by the actor's `usr_` id,
 *           never by a body field; an account the provider does not know is `UnauthenticatedError`. Not an MCP tool.
 * Runtime: node
 * Governing contract: ADR 0206 (decision 8); ADR 0462; ADR 0294 (decisions 16 and 21); STA-1538.
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { UnauthenticatedError } from "@stackra/errors";

import type { IdpAdmin } from "#contracts/index";
import type { RegisterPasskeyInput } from "#node/schemas/register-passkey-input.schema";
import { RegisterPasskeyOutput } from "#node/schemas/register-passkey-output.schema";

/**
 * Starts a passkey registration for the caller.
 *
 * @example
 * const { passkeyId, options } = await pipeline.execute(RegisterPasskeyAction, {}, { actor });
 */
export class RegisterPasskeyAction extends Action({
  key: "passkey.register",
  actors: [ActorKind.User],
  // reason: a passkey is created on the person's own device, never by an agent
  tool: false,
}) {
  /** The identity provider. */
  private readonly idp: IdpAdmin;

  /**
   * @param idp - finds the caller's provider user and starts the registration.
   */
  constructor(idp: IdpAdmin) {
    super();
    this.idp = idp;
  }

  /** Starts the registration for the caller's provider user. */
  async handle(_input: RegisterPasskeyInput, ctx: ActionContext): Promise<RegisterPasskeyOutput> {
    const userId = await this.idp.findUserId(ctx.actor.id);
    if (userId === undefined) throw UnauthenticatedError.create();
    return RegisterPasskeyOutput.create(await this.idp.startPasskeyRegistration(userId));
  }
}
