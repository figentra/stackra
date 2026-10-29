/**
 * Stackra file contract:
 * Purpose: `EndErasedSubjectSessionsListener`, the sign-in side of an erasure: after @stackra/privacy's
 *          `SubjectErased`, every identity provider session of the erased subject ends, so each of the subject's
 *          devices sees `SessionStatus.Revoked` on its next refresh and wipes what it keeps (the on-device search
 *          index among it).
 * Boundary: subscribed by the type of the event parameter; runs after commit, once per event id. The provider's user is
 *           found by the subject's `usr_` id; a subject the provider does not know has no session to end. Ending is
 *           idempotent, so a redelivery changes nothing. It lives here, not in privacy: identity already sits above
 *           what privacy depends on and privacy does not depend on identity, so identity importing privacy's event
 *           keeps the graph acyclic, while privacy would need identity for `IdpAdmin`. It acks nothing.
 * Runtime: node
 * Governing contract: ADR 0189 (decision 2: erasure reaches every copy); ADR 0078 (decision 4: listener semantics);
 *                     ADR 0206; STA-1543; STA-1540.
 */
import { Listener, type ListenerContext } from "@stackra/events";
import type { SubjectErased } from "@stackra/privacy";

import type { IdpAdmin } from "#contracts/index";

/**
 * Ends the erased subject's provider sessions.
 *
 * @example
 * await listener.handle(SubjectErased.create({ erasureId, subject: "usr_1", erased, kept, shredded: true, at }), ctx);
 */
export class EndErasedSubjectSessionsListener extends Listener {
  /** The identity provider. */
  private readonly idp: IdpAdmin;

  /**
   * @param idp - finds the subject's provider user and ends its sessions.
   */
  constructor(idp: IdpAdmin) {
    super();
    this.idp = idp;
  }

  /** Ends every provider session of the subject. */
  async handle(event: SubjectErased, _ctx: ListenerContext): Promise<void> {
    const userId = await this.idp.findUserId(event.subject);
    if (userId !== undefined) await this.idp.endSessions(userId);
  }
}
