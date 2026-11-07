/**
 * Stackra file contract:
 * Purpose: `ConfirmPasskeyAction`, `identity.passkey.confirm@1`: hands the device's new credential to the identity
 *          provider to check and keep on the caller's own account under a name; `POST /passkeys/confirm`.
 * Boundary: a signed-in user only, for their own account (found by the actor's `usr_` id). The provider checks the
 *           attestation and that the passkey is the caller's pending one; a refusal is `UnauthenticatedError`. The
 *           audit entry names the passkey, not the credential, and whether it was the first strong factor. Not an
 *           MCP tool. Step-up (L4, STA-340): the pipeline asks none (`stepUp: { exempt: "first-factor-enrolment" }`);
 *           this action does. A user whose enrolled methods already reach AAL2 must have stepped up to AAL2; a user
 *           with no strong factor yet may enrol their first from a fresh session only. Both refuse
 *           `step_up_required` outside `IdentityConfig.stepUpMaxAgeMinutes` of the last sign-in.
 * Runtime: node
 * Governing contract: ADR 0206 (decision 8); ADR 0462; ADR 0294 (decisions 16 and 21); STA-1538.
 */
import { Action, type ActionContext, Idempotency } from "@stackra/actions";
import { ActorKind, AssuranceLevel } from "@stackra/contracts";
import { UnauthenticatedError } from "@stackra/errors";

import type { IdentityConfig } from "#config/identity.config";
import type { IdpAdmin } from "#contracts/index";
import { assuranceOf } from "#core/functions/assurance-of.function";
import { requireAssurance } from "#core/functions/require-assurance.function";
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
  idempotency: Idempotency.Optional,
  stepUp: { exempt: "first-factor-enrolment" },
  // reason: a passkey is created on the person's own device, never by an agent
  tool: false,
}) {
  /** The identity provider. */
  private readonly idp: IdpAdmin;

  /** The method-to-level map and the step-up age. */
  private readonly config: IdentityConfig;

  /**
   * @param idp - finds the caller's provider user, lists their methods and checks the credential.
   * @param config - the method-to-level map and the step-up age.
   */
  constructor(idp: IdpAdmin, config: IdentityConfig) {
    super();
    this.idp = idp;
    this.config = config;
  }

  /** Checks and keeps the passkey. */
  async handle(input: ConfirmPasskeyInput, ctx: ActionContext): Promise<ConfirmPasskeyOutput> {
    const userId = await this.idp.findUserId(ctx.actor.id);
    if (userId === undefined) throw UnauthenticatedError.create();
    // The first strong factor needs only a fresh sign-in; once the user has one, a new passkey needs AAL2.
    const enrolled = assuranceOf(
      { amr: await this.idp.listAuthMethods(userId) },
      this.config,
    ).level;
    const firstFactor = enrolled === undefined || enrolled === AssuranceLevel.Aal1;
    requireAssurance(
      { level: ctx.assurance?.level, authenticatedAt: ctx.assurance?.authTime },
      firstFactor ? AssuranceLevel.Aal1 : AssuranceLevel.Aal2,
      this.config,
      ctx.now(),
    );
    await this.idp.finishPasskeyRegistration(userId, input.passkeyId, input.credential, input.name);
    ctx.audit({ passkeyId: input.passkeyId, firstFactor });
    return ConfirmPasskeyOutput.create({ passkeyId: input.passkeyId });
  }
}
