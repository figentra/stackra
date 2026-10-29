/**
 * Stackra file contract:
 * Purpose: `EndAllMySessionsAction`, `identity.session.end_all@1`: "sign out everywhere": ends every identity provider
 *          session of the caller, this device's included, and answers how many ended; each device sees
 *          `SessionStatus.Revoked` on its next refresh. `DELETE /sessions`.
 * Boundary: a signed-in user only, for their own sessions (the provider's user is found by the actor's `usr_` id); a
 *           call on someone else's behalf (`onBehalfOf`) is `ForbiddenError`; a caller the provider does not know is
 *           `UnauthenticatedError`. No step-up: it only takes access away. Not an MCP tool.
 * Runtime: node
 * Governing contract: ADR 0206; ADR 0462; ADR 0294 (decisions 16 and 21); STA-1580.
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { ForbiddenError, UnauthenticatedError } from "@stackra/errors";

import type { IdpAdmin } from "#contracts/index";
import { EndedSessionsOutput } from "#node/schemas/ended-sessions-output.schema";
import type { SessionsInput } from "#node/schemas/sessions-input.schema";

/**
 * Ends every session of the caller.
 *
 * @example
 * const { ended } = await pipeline.execute(EndAllMySessionsAction, {}, { actor });
 */
export class EndAllMySessionsAction extends Action({
  key: "session.end_all",
  actors: [ActorKind.User],
  // reason: the account owner's own security settings, never an agent's
  tool: false,
}) {
  /** The identity provider. */
  private readonly idp: IdpAdmin;

  /**
   * @param idp - finds the caller's provider user and ends its sessions.
   */
  constructor(idp: IdpAdmin) {
    super();
    this.idp = idp;
  }

  /** Ends every session of the caller's provider user. */
  async handle(_input: SessionsInput, ctx: ActionContext): Promise<EndedSessionsOutput> {
    const { actor } = ctx;
    if (actor.kind !== ActorKind.User || actor.onBehalfOf !== undefined)
      throw ForbiddenError.create();
    const userId = await this.idp.findUserId(actor.id);
    if (userId === undefined) throw UnauthenticatedError.create();
    return EndedSessionsOutput.create({ ended: await this.idp.endSessions(userId) });
  }
}
