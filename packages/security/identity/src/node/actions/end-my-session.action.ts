/**
 * Stackra file contract:
 * Purpose: `EndMySessionAction`, `identity.session.end@1`: signs the caller out on one device by ending one of their
 *          own identity provider sessions; that device sees `SessionStatus.Revoked` on its next refresh.
 *          `DELETE /sessions/{sessionId}`.
 * Boundary: a signed-in user only, for their own sessions: the provider's user is found by the actor's `usr_` id, and
 *           a session id that is not among that user's live sessions is `NotFoundError` (so another person's session
 *           can be neither ended nor confirmed to exist). A call on someone else's behalf (`onBehalfOf`) is
 *           `ForbiddenError`; a caller the provider does not know is `UnauthenticatedError`. Not an MCP tool.
 * Runtime: node
 * Governing contract: ADR 0206; ADR 0462; ADR 0294 (decisions 16 and 21); STA-1580.
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { ForbiddenError, NotFoundError, UnauthenticatedError } from "@stackra/errors";

import type { IdpAdmin } from "#contracts/index";
import type { EndMySessionInput } from "#node/schemas/end-my-session-input.schema";
import { EndedSessionsOutput } from "#node/schemas/ended-sessions-output.schema";

/**
 * Ends one of the caller's sessions.
 *
 * @example
 * await pipeline.execute(EndMySessionAction, { sessionId: "ses_1" }, { actor });
 */
export class EndMySessionAction extends Action({
  key: "session.end",
  actors: [ActorKind.User],
  // reason: the account owner's own security settings, never an agent's
  tool: false,
}) {
  /** The identity provider. */
  private readonly idp: IdpAdmin;

  /**
   * @param idp - finds the caller's provider user, lists its sessions and ends one.
   */
  constructor(idp: IdpAdmin) {
    super();
    this.idp = idp;
  }

  /** Ends the named session once it is known to be the caller's own. */
  async handle(input: EndMySessionInput, ctx: ActionContext): Promise<EndedSessionsOutput> {
    const { actor } = ctx;
    if (actor.kind !== ActorKind.User || actor.onBehalfOf !== undefined)
      throw ForbiddenError.create();
    const userId = await this.idp.findUserId(actor.id);
    if (userId === undefined) throw UnauthenticatedError.create();
    const sessions = await this.idp.listSessions(userId);
    if (!sessions.some((session) => session.sessionId === input.sessionId))
      throw NotFoundError.create();
    await this.idp.endSession(input.sessionId);
    return EndedSessionsOutput.create({ ended: 1 });
  }
}
