/**
 * Stackra file contract:
 * Purpose: unit tests of `FilesystemHealthIndicatorDriver`: a `HealthIndicator` named `filesystem` that asks whether the probe path exists, reports `up` with a latency,
 *          and reports `down` (never throws) when the probe fails or runs past `health.timeout`, or `degraded` when
 *          `health.critical` is off; the detail names the error, never its message.
 * Boundary: test only; the `FileSystem` is a fake that records every call, nothing leaves the process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 16 and
 *                     17); registry gap R-27.
 */
import { buildConfig } from "@stackra/config";
import { HealthIndicator } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { FilesystemConfig } from "#config/filesystem.config";
import type { FileSystem } from "#contracts/ports/file-system.port";
import { FilesystemHealthIndicatorDriver } from "#core/drivers/filesystem-health-indicator.driver";

/** Every call the fake `FileSystem` received, with all its arguments. */
const calls: unknown[][] = [];

/** An indicator over a fake whose probe resolves, rejects with `error`, or never settles (`"hang"`). */
function indicator(
  outcome: "answer" | Error | "hang",
  health: Partial<FilesystemConfig["health"]> = {},
): FilesystemHealthIndicatorDriver {
  const probe = (...args: unknown[]): Promise<unknown> => {
    calls.push(args);
    if (outcome === "hang") return new Promise(() => undefined);
    return outcome === "answer" ? Promise.resolve(false) : Promise.reject(outcome);
  };
  const port = { exists: probe } as unknown as FileSystem;
  const config = buildConfig(FilesystemConfig, {
    values: { health: { timeout: "PT2S", critical: true, path: ".health", ...health } },
  });
  return new FilesystemHealthIndicatorDriver(port, config);
}

afterEach(() => {
  calls.length = 0;
  vi.useRealTimers();
});

describe("FilesystemHealthIndicatorDriver", () => {
  it("is a health indicator named filesystem that asks whether the probe path exists", async () => {
    const probe = indicator("answer");
    expect(probe).toBeInstanceOf(HealthIndicator);
    expect(probe.name).toBe("filesystem");
    const report = await probe.check();
    expect(report.status).toBe("up");
    expect(report.latency).toMatch(/^P/);
    expect(calls).toEqual([[".health"]]);
  });

  it("is down, without throwing, when the probe fails, naming the error but not its message", async () => {
    const report = await indicator(new TypeError("connect ECONNREFUSED secret.internal")).check();
    expect(report).toEqual({ status: "down", detail: "the disk did not answer (TypeError)" });
  });

  it("is degraded instead when the dependency is not critical", async () => {
    const report = await indicator(new Error("boom"), { critical: false }).check();
    expect(report.status).toBe("degraded");
  });

  it("is down once the probe runs past the configured timeout", async () => {
    vi.useFakeTimers();
    const pending = indicator("hang", {
      timeout: "PT1S" as FilesystemConfig["health"]["timeout"],
    }).check();
    await vi.advanceTimersByTimeAsync(1000);
    expect(await pending).toEqual({
      status: "down",
      detail: "the disk did not answer (TimeoutError)",
    });
  });
});
