/**
 * Stackra file contract:
 * Purpose: unit tests of `QueueHealthIndicatorDriver`: a `HealthIndicator` named `queue` that lists one dead letter, reports `up` with a latency,
 *          and reports `down` (never throws) when the probe fails or runs past `health.timeout`, or `degraded` when
 *          `health.critical` is off; the detail names the error, never its message.
 * Boundary: test only; the `QueueDriver` is a fake that records every call, nothing leaves the process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 16 and
 *                     17); registry gap R-27.
 */
import { buildConfig } from "@stackra/config";
import { Duration, HealthIndicator } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { QueueConfig } from "#config/queue.config";
import type { QueueDriver } from "#contracts/ports/queue-driver.port";
import { QueueHealthIndicatorDriver } from "#core/drivers/queue-health-indicator.driver";

/** Every call the fake `QueueDriver` received, with all its arguments. */
const calls: unknown[][] = [];

/** An indicator over a fake whose probe resolves, rejects with `error`, or never settles (`"hang"`). */
function indicator(
  outcome: "answer" | Error | "hang",
  health: Partial<QueueConfig["health"]> = {},
): QueueHealthIndicatorDriver {
  const probe = (...args: unknown[]): Promise<unknown> => {
    calls.push(args);
    if (outcome === "hang") return new Promise(() => {});
    return outcome === "answer" ? Promise.resolve([]) : Promise.reject(outcome);
  };
  const port = { deadLetters: probe } as unknown as QueueDriver;
  const config = buildConfig(QueueConfig, {
    values: { health: { timeout: Duration.seconds(2), critical: true, ...health } },
  });
  return new QueueHealthIndicatorDriver(port, config);
}

afterEach(() => {
  calls.length = 0;
  vi.useRealTimers();
});

describe("QueueHealthIndicatorDriver", () => {
  it("is a health indicator named queue that lists one dead letter", async () => {
    const probe = indicator("answer");
    expect(probe).toBeInstanceOf(HealthIndicator);
    expect(probe.name).toBe("queue");
    const report = await probe.check();
    expect(report.status).toBe("up");
    expect(report.latency).toMatch(/^P/);
    expect(calls).toEqual([[undefined, 1]]);
  });

  it("is down, without throwing, when the probe fails, naming the error but not its message", async () => {
    const report = await indicator(new TypeError("connect ECONNREFUSED secret.internal")).check();
    expect(report).toEqual({ status: "down", detail: "the queue did not answer (TypeError)" });
  });

  it("is degraded instead when the dependency is not critical", async () => {
    const report = await indicator(new Error("boom"), { critical: false }).check();
    expect(report.status).toBe("degraded");
  });

  it("is down once the probe runs past the configured timeout", async () => {
    vi.useFakeTimers();
    const pending = indicator("hang", {
      timeout: Duration.seconds(1),
    }).check();
    await vi.advanceTimersByTimeAsync(1000);
    expect(await pending).toEqual({
      status: "down",
      detail: "the queue did not answer (TimeoutError)",
    });
  });
});
