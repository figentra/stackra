/**
 * Stackra file contract:
 * Purpose: `EndErasedSubjectSessionsListener`, the sign-in side of an erasure: after @stackra/privacy's
 *          `SubjectErased`, every identity provider session of the erased subject ends, so each of the subject's
 *          devices sees `SessionStatus.Revoked` on its next refresh and wipes what it keeps (the on-device search
 *          index among it), and then the provider user itself is removed, so the subject can no longer sign in and the
 *          provider's copy of its name and email is gone.
 * Boundary: subscribed by the type of the event parameter; runs after commit, once per event id. The provider's user is
 *           found by the subject's `usr_` id (the `stackra_user_id` metadata `createUser` writes from
 *           `IdpUserInput.stackraUserId`); a subject the provider does not know is logged as a warning naming only
 *           the erasure id, so an erasure that reached no provider user is visible. A redelivery after the removal
 *           finds no user and only logs. It lives here, not in privacy: identity already sits above what privacy
 *           depends on and privacy does not depend on identity, so identity importing privacy's event keeps the
 *           graph acyclic, while privacy would need identity for `IdpAdmin`. It acks nothing.
 * Runtime: node
 * Governing contract: ADR 0189 (decision 2: erasure reaches every copy); ADR 0078 (decision 4: listener semantics);
 *                     ADR 0206; STA-1543; STA-1540.
 */
import type { Logger } from "@stackra/contracts";
import { Listener, type ListenerContext } from "@stackra/events";
import type { SubjectErased } from "@stackra/privacy";

import type { IdpAdmin } from "#contracts/index";

/**
 * Ends the erased subject's provider sessions and removes its provider user.
 *
 * @example
 * await listener.handle(SubjectErased.create({ erasureId, subject: "usr_1", erased, kept, shredded: true, at }), ctx);
 */
export class EndErasedSubjectSessionsListener extends Listener {
  /** The identity provider. */
  private readonly idp: IdpAdmin;

  /** Where an erasure that found no provider user is reported. */
  private readonly logger: Logger;

  /**
   * @param idp - finds the subject's provider user, ends its sessions and removes it.
   * @param logger - where an erasure that found no provider user is reported.
   */
  constructor(idp: IdpAdmin, logger: Logger) {
    super();
    this.idp = idp;
    this.logger = logger;
  }

  /** Ends every provider session of the subject, then removes its provider user. */
  async handle(event: SubjectErased, _ctx: ListenerContext): Promise<void> {
    const userId = await this.idp.findUserId(event.subject);
    if (userId === undefined) {
      this.logger.warn("identity.erasure.no_provider_user", { erasureId: event.erasureId });
      return;
    }
    // Sessions first, so the devices see revoked even if the removal fails and the event is redelivered.
    await this.idp.endSessions(userId);
    await this.idp.removeUser(userId);
  }
}
