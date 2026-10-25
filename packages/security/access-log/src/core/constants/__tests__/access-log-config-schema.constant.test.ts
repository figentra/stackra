/**
 * Stackra file contract:
 * Purpose: unit tests of `ACCESS_LOG_CONFIG_SCHEMA`: `postgres` and 400 days by default, the two shipped sinks only,
 *          and a whole number of days from 90.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 26); ADR 0212 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { ACCESS_LOG_CONFIG_SCHEMA } from "#core/constants/access-log-config-schema.constant";
import { ACCESS_LOG_SINK_DRIVERS } from "#core/constants/access-log-sink-drivers.constant";

describe("ACCESS_LOG_CONFIG_SCHEMA", () => {
  it("defaults to the postgres sink and 400 days", () => {
    expect(ACCESS_LOG_CONFIG_SCHEMA.parse({})).toEqual({ sink: "postgres", retentionDays: 400 });
  });

  it("takes each shipped sink and nothing else", () => {
    for (const sink of ACCESS_LOG_SINK_DRIVERS)
      expect(ACCESS_LOG_CONFIG_SCHEMA.parse({ sink }).sink).toBe(sink);
    expect(ACCESS_LOG_CONFIG_SCHEMA.safeParse({ sink: "siem" }).success).toBe(false);
  });

  it("keeps at least 90 whole days", () => {
    expect(ACCESS_LOG_CONFIG_SCHEMA.parse({ retentionDays: 90 }).retentionDays).toBe(90);
    expect(ACCESS_LOG_CONFIG_SCHEMA.safeParse({ retentionDays: 89 }).success).toBe(false);
    expect(ACCESS_LOG_CONFIG_SCHEMA.safeParse({ retentionDays: 120.5 }).success).toBe(false);
  });
});
