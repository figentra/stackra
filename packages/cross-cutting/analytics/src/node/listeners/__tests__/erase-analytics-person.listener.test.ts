/**
 * Stackra file contract:
 * Purpose: unit tests of `EraseAnalyticsPersonListener`: after `SubjectErased`, the driver erases the subject's person
 *          and only its deliveries, the receipt is logged by erasure id and person count, and a driver's rejection
 *          (a PostHog driver with no personal API key) passes on unlogged, so the outbox retries and dead-letters it.
 * Boundary: test only; the memory driver stands in for PostHog.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0189 (decision 2); STA-1582.
 */
import { buildConfig } from "@stackra/config";
import { Logger } from "@stackra/contracts";
import { Listener } from "@stackra/events";
import type { ListenerContext } from "@stackra/events";
import { SubjectErased } from "@stackra/privacy";
import { describe, expect, Fake, it } from "@stackra/testing";

import { AnalyticsConfig } from "#config/analytics.config";
import { MemoryAnalyticsDriver } from "#core/drivers/memory-analytics.driver";
import { PosthogAnalyticsDriver } from "#core/drivers/posthog-analytics.driver";
import { EraseAnalyticsPersonListener } from "#node/listeners/erase-analytics-person.listener";

const CTX = {} as ListenerContext;

/** The erasure receipt of `subject`. */
function erased(subject: string): SubjectErased {
  return SubjectErased.create({
    erasureId: "era_1",
    subject,
    erased: [],
    kept: [],
    shredded: true,
    at: "2026-10-29T12:00:00.000Z",
  });
}

/** Records every log line; the methods are left to the spies (`declare` satisfies the abstract members). */
class LoggerFake extends Fake.of(Logger) {
  declare debug: Logger["debug"];

  declare info: Logger["info"];

  declare warn: Logger["warn"];

  declare error: Logger["error"];
}

/** A delivery of `userId`. */
const delivery = (userId: string) => ({
  eventId: `evt_${userId}`,
  name: "lead.submitted",
  properties: {},
  occurredAt: "2026-10-29T09:00:00.000Z",
  anonymousId: `anon_${userId}`,
  userId,
  sessionId: "ses_1",
  context: { library: { name: "@stackra/analytics" } },
});

describe(EraseAnalyticsPersonListener, () => {
  it("is a listener", () => {
    expect(
      new EraseAnalyticsPersonListener(new MemoryAnalyticsDriver(), new LoggerFake()),
    ).toBeInstanceOf(Listener);
  });

  it("erases the subject's person only, and logs the receipt", async () => {
    const driver = new MemoryAnalyticsDriver();
    await driver.send([delivery("usr_1"), delivery("usr_2")]);
    const logger = new LoggerFake();
    await new EraseAnalyticsPersonListener(driver, logger).handle(erased("usr_1"), CTX);
    expect(driver.erased()).toEqual(["usr_1"]);
    expect(driver.delivered().map((item) => item.userId)).toEqual(["usr_2"]);
    expect(logger.info).toHaveBeenCalledWith("analytics.erasure.erased", {
      erasureId: "era_1",
      persons: 1,
    });
  });

  it("passes a missing PostHog personal API key on, unlogged", async () => {
    const driver = new PosthogAnalyticsDriver(
      buildConfig(AnalyticsConfig, { values: { driver: "posthog", posthogKey: "phc_test" } }),
    );
    const logger = new LoggerFake();
    await expect(
      new EraseAnalyticsPersonListener(driver, logger).handle(erased("usr_1"), CTX),
    ).rejects.toThrow(/ANALYTICS_POSTHOG_PERSONAL_API_KEY/);
    expect(logger.info).not.toHaveBeenCalled();
  });
});
