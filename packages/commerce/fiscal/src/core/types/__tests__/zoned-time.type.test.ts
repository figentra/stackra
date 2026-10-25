/**
 * Stackra file contract:
 * Purpose: type tests of `ZonedTime`: three strings, all required.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import type { ZonedTime } from "#core/types/zoned-time.type";

describe("ZonedTime", () => {
  it("takes a date, time and offset and refuses a missing offset", () => {
    const time: ZonedTime = { date: "2026-01-01", time: "00:00:00", offset: "+00:00" };
    // @ts-expect-error -- the offset is always stated
    const local: ZonedTime = { date: "2026-01-01", time: "00:00:00" };
    expect([time.offset, local.date]).toEqual(["+00:00", "2026-01-01"]);
  });
});
