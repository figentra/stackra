/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the template's `NotificationsNotifierDriver` and gen's
 *          `registerNotificationMails` and the default `MESSAGES_NOTIFIER_TARGET` are exported, the client and the service descriptor are not, and
 *          `NotificationMails` resolves as a type.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as node from "#node/index";
import type { NotificationMails, NotifierMessage, NotifierTarget } from "#node/index";

describe("@stackra/notifications/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "MESSAGES_NOTIFIER_TARGET",
      "NotificationsNotifierDriver",
      "registerNotificationMails",
    ]);
  });

  it("exports NotificationMails as a type", () => {
    expectTypeOf<NotificationMails>().toHaveProperty("bodies");
    expectTypeOf<NotificationMails>().toHaveProperty("catalogues");
  });

  it("exports NotifierTarget and NotifierMessage as types", () => {
    expectTypeOf<NotifierTarget>().toHaveProperty("payload");
    expectTypeOf<NotifierMessage>().toHaveProperty("market");
  });
});
