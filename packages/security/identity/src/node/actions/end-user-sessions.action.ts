/**
 * Stackra file contract:
 * Purpose: `EndUserSessionsAction`, `identity.session.end_user@1`: an administrator's "sign out everywhere" for another
 *          user (a lost device, a suspected takeover, an offboarding): ends every identity provider session of the
 *          named `usr_` user, audits it and answers how many ended. `DELETE /users/{subject}/sessions`.
 * Boundary: a user or a service holding `identity.session.end_user` (L3). The provider's user is found by the subject's
 *           `usr_` id; one the provider does not know is `NotFoundError`. The provider's sessions span every scope the
 *           person belongs to, and identity holds no membership to check a scope administrator's reach, so a product
 *           grants this permission to platform or support roles only (STA-1580 owner decision). The audit entry names
 *           the subject and the count, nothing more. Not an MCP tool: an agent never signs a person out.
 * Runtime: node
 * Governing contract: ADR 0206; ADR 0462; ADR 0294 (decisions 16 and 21); ADR 0099 (risk); STA-1580.
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";

import type { IdpAdmin } from "#contracts/index";
import type { EndUserSessionsInput } from "#node/schemas/end-user-sessions-input.schema";
import { EndedSessionsOutput } from "#node/schemas/ended-sessions-output.schema";

/**
 * Ends every session of another user.
 *
 * @example
 * const { ended } = await pipeline.execute(EndUserSessionsAction, { subject: "usr_1" }, { actor: admin });
 */
export class EndUserSessionsAction extends Action({
  key: "session.end_user",
  actors: [ActorKind.User, ActorKind.Service],
  // reason: signing a person out is an administrator's decision, never an agent's
  tool: false,
}) {
  /** The identity provider. */
  private readonly idp: IdpAdmin;

  /**
   * @param idp - finds the subject's provider user and ends its sessions.
   */
  constructor(idp: IdpAdmin) {
    super();
    this.idp = idp;
  }

  /** Ends every session of the subject's provider user and audits the count. */
  async handle(input: EndUserSessionsInput, ctx: ActionContext): Promise<EndedSessionsOutput> {
    const userId = await this.idp.findUserId(input.subject);
    if (userId === undefined) throw NotFoundError.create();
    const ended = await this.idp.endSessions(userId);
    ctx.audit({ subject: input.subject, ended });
    return EndedSessionsOutput.create({ ended });
  }
}
