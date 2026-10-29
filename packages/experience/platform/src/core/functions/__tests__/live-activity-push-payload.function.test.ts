/**
 * Stackra file contract:
 * Purpose: unit tests of `liveActivityPushPayload`: the content state expo-widgets decodes, the dismissal date of an
 *          end, and the attributes and alert of a push-to-start.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; STA-1539.
 */
import { describe, expect, it } from "@stackra/testing";

import type { ActivityProgress } from "#contracts/types/activity-progress.type";
import { liveActivityPushPayload } from "#core/functions/live-activity-push-payload.function";

const ORDER: ActivityProgress = {
  reference: "order_1042",
  title: "Order 1042",
  status: "On the way",
  step: 3,
  steps: 4,
  url: "app://orders/1042",
};
const NOW = new Date("2026-10-29T12:00:00Z");
const LATER = new Date("2026-10-29T12:15:00Z");

describe("liveActivityPushPayload", () => {
  it("carries the OrderProgress content state without the deep link on an update", () => {
    const { url: _url, ...props } = ORDER;
    expect(liveActivityPushPayload("update", ORDER, NOW, LATER)).toEqual({
      aps: {
        timestamp: 1_793_275_200,
        event: "update",
        "content-state": { name: "OrderProgress", props: JSON.stringify(props) },
      },
    });
  });

  it("dates the dismissal of an end", () => {
    expect(liveActivityPushPayload("end", ORDER, NOW, LATER).aps["dismissal-date"]).toBe(
      1_793_276_100,
    );
  });

  it("gives a start the attributes with the deep link and an alert", () => {
    expect(liveActivityPushPayload("start", ORDER, NOW, LATER).aps).toMatchObject({
      "attributes-type": "LiveActivityAttributes",
      attributes: { url: "app://orders/1042" },
      alert: { title: "Order 1042", body: "On the way" },
    });
  });
});
