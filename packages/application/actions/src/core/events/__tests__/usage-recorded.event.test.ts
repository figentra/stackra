/**
 * Stackra file contract:
 * Purpose: unit tests of `UsageRecorded`: an integration event named `usage.recorded` at version 1, with its schema
 *          registered, built with `create` from its fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0216 (decisions 1 and 4).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { MeterKind } from "#core/enums/meter-kind.enum";
import { UsageRecorded } from "#core/events/usage-recorded.event";

describe("UsageRecorded", () => {
  it("is an integration event built from its fields", () => {
    expect(kindOf(UsageRecorded)?.kind).toBe("integration_event");
    expect(kindOf(UsageRecorded)?.options).toMatchObject({ name: "usage.recorded", version: 1 });
    expect(schemaOf(UsageRecorded)).toBeDefined();
    const event = UsageRecorded.create({
      meter: "messages.sent",
      kind: MeterKind.Count,
      value: 1,
      key: "messages.message.send@1",
      callId: "c2",
    });
    expect(event).toMatchObject({ meter: "messages.sent", value: 1 });
  });
});
