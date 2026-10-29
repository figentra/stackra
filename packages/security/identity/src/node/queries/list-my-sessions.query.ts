/**
 * Stackra file contract:
 * Purpose: `ListMySessionsQuery`, `identity.session.list@1`: the caller's live identity provider sessions (when each
 *          started, when it was last used, the device), so the security page shows where the person is signed in;
 *          `GET /sessions`.
 * Boundary: read only; a signed-in user's own sessions only: the provider's user is found by the actor's `usr_` id,
 *           never by a body field. A caller the provider does not know, or one that is not a user, has none. Not an
 *           MCP tool.
 * Runtime: node
 * Governing contract: ADR 0206; ADR 0462; ADR 0294 (decisions 16 and 21); STA-1580.
 */
import { Query, type QueryContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";

import type { IdpAdmin } from "#contracts/index";
import type { SessionsInput } from "#node/schemas/sessions-input.schema";
import { SessionsOutput } from "#node/schemas/sessions-output.schema";

/**
 * Lists the caller's sessions.
 *
 * @example
 * const { sessions } = await pipeline.execute(ListMySessionsQuery, {}, { actor });
 */
export class ListMySessionsQuery extends Query({
  key: "session.list",
  actors: [ActorKind.User],
  // reason: the account owner's own security settings, never an agent's
  tool: false,
}) {
  /** The identity provider. */
  private readonly idp: IdpAdmin;

  /**
   * @param idp - finds the caller's provider user and lists its sessions.
   */
  constructor(idp: IdpAdmin) {
    super();
    this.idp = idp;
  }

  /** The caller's live sessions, or none. */
  async handle(_input: SessionsInput, ctx: QueryContext): Promise<SessionsOutput> {
    const { actor } = ctx;
    const userId = actor.kind === ActorKind.User ? await this.idp.findUserId(actor.id) : undefined;
    return SessionsOutput.create({
      sessions: userId === undefined ? [] : [...(await this.idp.listSessions(userId))],
    });
  }
}
