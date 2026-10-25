/**
 * Stackra file contract:
 * Purpose: unit tests of `HeartbeatKind`: the three kinds of job that send a heartbeat, as snake_case codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0184 (decision 4); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { HeartbeatKind } from "#core/enums/heartbeat-kind.enum";

describe("HeartbeatKind", () => {
  it("lists crons, relays and workers", () => {
    expect(Enum.values(HeartbeatKind)).toEqual(["cron", "relay", "worker"]);
    expectTypeOf<HeartbeatKind>().toEqualTypeOf<"cron" | "relay" | "worker">();
  });
});
