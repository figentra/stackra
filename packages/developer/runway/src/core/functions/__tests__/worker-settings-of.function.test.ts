/**
 * Stackra file contract:
 * Purpose: unit tests of `workerSettingsOf`: the base applies to every Worker, a preset, the repository's defaults and
 *          the member each override the layer below key by key, and the target's compatibility date is the fallback.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0519 (decision 2); STA-1988.
 */
import { describe, expect, it } from "@stackra/testing";

import { CLOUDFLARE_WORKERS_SETTINGS_SCHEMA } from "#core/constants/cloudflare-workers-settings-schema.constant";
import { workerSettingsOf } from "#core/functions/worker-settings-of.function";

const target = (extra: Record<string, unknown>) =>
  CLOUDFLARE_WORKERS_SETTINGS_SCHEMA.parse({
    compatibilityDate: "2026-10-01",
    members: { w: { path: "workers/w", ...extra } },
  });

describe("workerSettingsOf", () => {
  it("gives a member with no preset the base and the root's compatibility date", () => {
    const settings = workerSettingsOf(target({}), "w");
    expect(settings.compatibilityDate).toBe("2026-10-01");
    expect(settings.workersDev).toBe(false);
    expect(settings.observability).toEqual({
      logs: true,
      invocationLogs: true,
      issues: true,
      redactQueryString: true,
    });
  });

  it("merges preset, defaults and member key by key, later winning", () => {
    const parsed = CLOUDFLARE_WORKERS_SETTINGS_SCHEMA.parse({
      defaults: { compatibilityDate: "2026-11-01", observability: { headSamplingRate: 0.5 } },
      members: {
        w: { path: "workers/w", preset: "api", observability: { issues: false } },
      },
    });
    const settings = workerSettingsOf(parsed, "w");
    expect(settings.compatibilityDate).toBe("2026-11-01");
    expect(settings.observability).toEqual({
      logs: true,
      invocationLogs: true,
      issues: false,
      redactQueryString: true,
      traces: true,
      headSamplingRate: 0.5,
    });
  });

  it("refuses an unknown preset or Worker key", () => {
    expect(() => target({ preset: "nope" })).toThrow();
    expect(() => target({ coloHint: "x" })).toThrow();
  });
});
