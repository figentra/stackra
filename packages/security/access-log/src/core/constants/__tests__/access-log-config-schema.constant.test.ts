/**
 * Stackra file contract:
 * Purpose: unit tests of `ACCESS_LOG_CONFIG_SCHEMA`: `postgres`, 400 days and financial and health failing closed by
 *          default, the shipped sinks only, known classes only in `failClosed`, and a whole number of days from 90.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 26); ADR 0212 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { ACCESS_LOG_CONFIG_SCHEMA } from "#core/constants/access-log-config-schema.constant";
import { ACCESS_LOG_SINK_DRIVERS } from "#core/constants/access-log-sink-drivers.constant";

describe("ACCESS_LOG_CONFIG_SCHEMA", () => {
  it("defaults to the postgres sink and 400 days", () => {
    expect(ACCESS_LOG_CONFIG_SCHEMA.parse({})).toEqual({
      sink: "postgres",
      retentionDays: 400,
      failClosed: ["financial", "health"],
    });
  });

  it("takes each shipped sink and nothing else", () => {
    for (const sink of ACCESS_LOG_SINK_DRIVERS)
      expect(ACCESS_LOG_CONFIG_SCHEMA.parse({ sink }).sink).toBe(sink);
    expect(ACCESS_LOG_CONFIG_SCHEMA.safeParse({ sink: "siem" }).success).toBe(false);
  });

  it("takes known data classes as the fail-closed list (STA-821)", () => {
    expect(ACCESS_LOG_CONFIG_SCHEMA.parse({ failClosed: [] }).failClosed).toEqual([]);
    expect(ACCESS_LOG_CONFIG_SCHEMA.parse({ failClosed: ["personal"] }).failClosed).toEqual([
      "personal",
    ]);
    expect(ACCESS_LOG_CONFIG_SCHEMA.safeParse({ failClosed: ["secret"] }).success).toBe(false);
  });

  it("keeps at least 90 whole days", () => {
    expect(ACCESS_LOG_CONFIG_SCHEMA.parse({ retentionDays: 90 }).retentionDays).toBe(90);
    expect(ACCESS_LOG_CONFIG_SCHEMA.safeParse({ retentionDays: 89 }).success).toBe(false);
    expect(ACCESS_LOG_CONFIG_SCHEMA.safeParse({ retentionDays: 120.5 }).success).toBe(false);
  });
});
