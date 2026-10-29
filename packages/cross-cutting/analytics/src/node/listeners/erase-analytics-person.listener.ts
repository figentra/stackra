/**
 * Stackra file contract:
 * Purpose: `EraseAnalyticsPersonListener`, the analytics side of an erasure (STA-1582): after @stackra/privacy's
 *          `SubjectErased`, the bound `AnalyticsDriver` deletes the subject's person, with its events, at the vendor
 *          (PostHog), and the outcome is logged as the erasure's analytics receipt (`analytics.erasure.erased`, by
 *          erasure id and person count, never the subject).
 * Boundary: subscribed by the type of the event parameter; runs after commit, once per event id. The subject's public
 *           id is the distinct id an identified visitor's events carry (`userId`), and `$identify` merged its
 *           anonymous ids into the same person, so one delete reaches them all. A driver's rejection (a vendor error,
 *           or a PostHog driver with no personal API key or project id) passes on, so the outbox retries and then
 *           dead-letters it: a missing key is never a silent success. The `none` driver resolves 0 persons. It lives
 *           here, not in privacy, as identity's erasure listener does: privacy does not depend on analytics, so
 *           analytics importing privacy's event keeps the graph acyclic. It acks nothing.
 * Runtime: node
 * Governing contract: ADR 0189 (decision 2: erasure reaches every copy); ADR 0078 (decision 4: listener semantics);
 *                     ADR 0298; STA-1582.
 */
import type { Logger } from "@stackra/contracts";
import { Listener, type ListenerContext } from "@stackra/events";
import type { SubjectErased } from "@stackra/privacy";

import type { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";

/**
 * Deletes the erased subject's analytics person at the vendor.
 *
 * @example
 * await listener.handle(SubjectErased.create({ erasureId, subject: "usr_1", erased, kept, shredded: true, at }), ctx);
 */
export class EraseAnalyticsPersonListener extends Listener {
  /** The bound analytics driver (`config:analytics.driver`). */
  private readonly driver: AnalyticsDriver;

  /** Where the erasure's analytics receipt is written. */
  private readonly logger: Logger;

  /**
   * @param driver - deletes the subject's person at the vendor.
   * @param logger - where the erasure's analytics receipt is written.
   */
  constructor(driver: AnalyticsDriver, logger: Logger) {
    super();
    this.driver = driver;
    this.logger = logger;
  }

  /** Deletes the subject's person, then logs how many the vendor held. */
  async handle(event: SubjectErased, _ctx: ListenerContext): Promise<void> {
    const persons = await this.driver.erasePerson(event.subject);
    this.logger.info("analytics.erasure.erased", { erasureId: event.erasureId, persons });
  }
}
