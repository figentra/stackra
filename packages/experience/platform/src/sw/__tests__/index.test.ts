/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./sw` entry: the six `handle*` functions the template's generated `sw.ts`
 *          registers, the kill-switch worker's source, and
 *          nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#sw` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0127 2026-10-24 note (`./sw`);
 *                     ADR 0325 (rule 18).
 */
import { describe, expect, it } from "@stackra/testing";

import * as sw from "#sw/index";

describe("@stackra/platform/sw", () => {
  it("exports exactly the six handlers and the kill switch", () => {
    expect(Object.keys(sw).sort()).toEqual([
      "handleBackgroundSync",
      "handleNotificationClick",
      "handlePush",
      "handlePushSubscriptionChange",
      "handleShareTarget",
      "handleSkipWaiting",
      "killSwitchServiceWorker",
    ]);
  });
});
