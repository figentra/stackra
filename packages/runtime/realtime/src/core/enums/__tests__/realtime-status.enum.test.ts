/**
 * Stackra file contract:
 * Purpose: unit and type tests of `RealtimeStatus`: three snake_case codes in source order, members named as the
 *          console's indicator reads them, and a type of the same name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { RealtimeStatus } from "#core/enums/realtime-status.enum";

describe("RealtimeStatus", () => {
  it("holds the three connection states in order", () => {
    expect(Enum.values(RealtimeStatus)).toEqual(["connected", "connecting", "disconnected"]);
    expect(RealtimeStatus.Connected).toBe("connected");
    expect(RealtimeStatus.Connecting).toBe("connecting");
    expect(RealtimeStatus.Disconnected).toBe("disconnected");
  });

  it("is a type of the same name", () => {
    expectTypeOf<RealtimeStatus>().toEqualTypeOf<"connected" | "connecting" | "disconnected">();
    const look: Record<RealtimeStatus, string> = {
      [RealtimeStatus.Connected]: "Live",
      [RealtimeStatus.Connecting]: "Connecting",
      [RealtimeStatus.Disconnected]: "Offline",
    };
    expect(Object.keys(look)).toHaveLength(3);
  });
});
