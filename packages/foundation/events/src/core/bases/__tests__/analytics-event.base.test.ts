/**
 * Stackra file contract:
 * Purpose: unit tests of `AnalyticsEvent`: called with its name, recorded as the `analytics_event` kind; a name that
 *          is not dotted snake_case is refused; the class is an `Event` built with `create`.
 * Boundary: test only; registers a zod schema the way gen does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rules 19 and 20); ADR 0298 (decision 5).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { AnalyticsEvent } from "#core/bases/analytics-event.base";
import { Event } from "#core/bases/event.base";

class BarcodeScanned extends AnalyticsEvent({ name: "scan.barcode_scanned" }) {
  found!: boolean;
}

registerSchemas([[BarcodeScanned, z.object({ found: z.boolean() })]]);

describe("AnalyticsEvent", () => {
  it("records its name", () => {
    expect(kindOf(BarcodeScanned)).toEqual({
      kind: "analytics_event",
      options: { name: "scan.barcode_scanned" },
    });
  });

  it("refuses a name that is not dotted snake_case", () => {
    expect(() => AnalyticsEvent({ name: "Lead Submitted" })).toThrow(TypeError);
    expect(() => AnalyticsEvent(undefined as never)).toThrow(TypeError);
  });

  it("builds an Event with create", () => {
    const event = BarcodeScanned.create({ found: true });
    expect(event).toBeInstanceOf(BarcodeScanned);
    expect(event).toBeInstanceOf(Event);
    expect(event.found).toBe(true);
  });
});
