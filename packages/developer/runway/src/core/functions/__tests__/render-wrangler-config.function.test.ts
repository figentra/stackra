/**
 * Stackra file contract:
 * Purpose: unit tests of `renderWranglerConfig`: settings are added to the code facts in wrangler's keys, only a set
 *          setting is written, and an operational key already in the member's config is refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0519 (decisions 1 and 3); STA-1989.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { renderWranglerConfig } from "#core/functions/render-wrangler-config.function";

describe("renderWranglerConfig", () => {
  it("adds the settings in wrangler's keys to the code facts", () => {
    expect(
      renderWranglerConfig(
        { name: "api", main: "src/index.ts" },
        {
          compatibilityDate: "2026-10-01",
          workersDev: false,
          cache: true,
          limits: { cpuMs: 50 },
          observability: { logs: true, invocationLogs: true, headSamplingRate: 0.1, issues: true },
        },
      ),
    ).toEqual({
      name: "api",
      main: "src/index.ts",
      compatibility_date: "2026-10-01",
      workers_dev: false,
      cache: { enabled: true },
      limits: { cpu_ms: 50 },
      observability: {
        enabled: true,
        head_sampling_rate: 0.1,
        issues: { enabled: true },
        logs: { enabled: true, invocation_logs: true },
      },
    });
  });

  it("writes nothing for a setting that is not set", () => {
    expect(renderWranglerConfig({ name: "api" }, {})).toEqual({ name: "api" });
  });

  it("renders custom domains as wrangler routes, and refuses routes the code facts already hold", () => {
    expect(
      renderWranglerConfig(
        { name: "env-sync" },
        { customDomains: ["env-sync.stackra.figentra.com"] },
      ),
    ).toEqual({
      name: "env-sync",
      routes: [{ pattern: "env-sync.stackra.figentra.com", custom_domain: true }],
    });
    expect(() =>
      renderWranglerConfig({ routes: [] }, { customDomains: ["env-sync.stackra.figentra.com"] }),
    ).toThrow(RunwayInvalidError);
  });

  it("refuses a key both homes hold", () => {
    expect(() => renderWranglerConfig({ workers_dev: true }, { workersDev: false })).toThrow(
      RunwayInvalidError,
    );
  });
});
