/**
 * Stackra file contract:
 * Purpose: unit tests of `ACCESS_LOG_CONFIG_SCHEMA`: `postgres`, 400 days and financial, health and regulated failing
 *          closed by default, the shipped sinks only, known classes only in `failClosed`, a whole number of days from 90,
 *          the audit retention left to the owner, and an HTTPS export endpoint or none.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 26); ADR 0212 (decision 6); STA-1579.
 */
import { describe, expect, it } from "@stackra/testing";

import { ACCESS_LOG_CONFIG_SCHEMA } from "#core/constants/access-log-config-schema.constant";
import { ACCESS_LOG_SINK_DRIVERS } from "#core/constants/access-log-sink-drivers.constant";

describe("ACCESS_LOG_CONFIG_SCHEMA", () => {
  it("defaults to the postgres sink and 400 days", () => {
    expect(ACCESS_LOG_CONFIG_SCHEMA.parse({})).toEqual({
      sink: "postgres",
      retentionDays: 400,
      failClosed: ["financial", "health", "regulated"],
      exportUrl: "",
      exportToken: "",
    });
  });

  it("leaves the audit retention unset for the owner and takes whole days from 1 (STA-1579)", () => {
    expect(ACCESS_LOG_CONFIG_SCHEMA.parse({})).not.toHaveProperty("auditRetentionDays");
    expect(ACCESS_LOG_CONFIG_SCHEMA.parse({ auditRetentionDays: 2555 }).auditRetentionDays).toBe(
      2555,
    );
    expect(ACCESS_LOG_CONFIG_SCHEMA.safeParse({ auditRetentionDays: 0 }).success).toBe(false);
  });

  it("takes an HTTPS export endpoint or none", () => {
    const exportUrl = "https://siem.acme.example/ingest";
    expect(ACCESS_LOG_CONFIG_SCHEMA.parse({ exportUrl }).exportUrl).toBe(exportUrl);
    expect(
      ACCESS_LOG_CONFIG_SCHEMA.safeParse({ exportUrl: "http://siem.acme.example" }).success,
    ).toBe(false);
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
