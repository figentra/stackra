/**
 * Stackra file contract:
 * Purpose: unit tests of `answerProbe`: `/healthz` is 200 until a drain, `/readyz` is 200 when no indicator is down
 *          (degraded included) and 503 otherwise, a throwing or silent indicator is down, the body is a status per
 *          name with no detail, and any other route or method is not answered.
 * Boundary: test only; indicators are fakes and the timeout runs on fake timers.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; registry gap R-27.
 */
import { HealthIndicator, HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { HEALTH_TIMEOUT_MS } from "#server/constants/health-timeout.constant";
import { answerProbe } from "#server/functions/answer-probe.function";

/** An indicator that answers with `run`. */
class FakeIndicator extends HealthIndicator {
  constructor(
    readonly name: string,
    private readonly run: () => Promise<HealthReport>,
  ) {
    super();
  }

  check(): Promise<HealthReport> {
    return this.run();
  }
}

const reports = (name: string, status: HealthStatus): FakeIndicator =>
  new FakeIndicator(name, async () => ({ status, detail: "secret host db.internal" }));

describe("answerProbe", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("answers /healthz 200 while alive and 503 once draining", async () => {
    expect(await answerProbe("GET", "/healthz", { alive: () => true, indicators: [] })).toEqual({
      status: 200,
      body: { status: "up" },
    });
    expect(await answerProbe("GET", "/healthz", { alive: () => false, indicators: [] })).toEqual({
      status: 503,
      body: { status: "draining" },
    });
  });

  it("answers /readyz 200 with a status per name and no detail", async () => {
    const answer = await answerProbe("GET", "/readyz", {
      alive: () => true,
      indicators: [reports("postgres", HealthStatus.Up), reports("redis", HealthStatus.Degraded)],
    });
    expect(answer).toEqual({ status: 200, body: { postgres: "up", redis: "degraded" } });
  });

  it("answers /readyz 503 when an indicator is down, throws or runs past the timeout", async () => {
    vi.useFakeTimers();
    const throwing = new FakeIndicator("queue", () => Promise.reject(new Error("boom")));
    const silent = new FakeIndicator("mail", () => new Promise(() => undefined));
    const pending = answerProbe("GET", "/readyz", {
      alive: () => true,
      indicators: [reports("postgres", HealthStatus.Down), throwing, silent],
    });
    await vi.advanceTimersByTimeAsync(HEALTH_TIMEOUT_MS);
    expect(await pending).toEqual({
      status: 503,
      body: { postgres: "down", queue: "down", mail: "down" },
    });
  });

  it("answers /readyz 503 once draining, and 200 with no indicators", async () => {
    expect(
      (await answerProbe("GET", "/readyz", { alive: () => false, indicators: [] }))?.status,
    ).toBe(503);
    expect(
      (await answerProbe("GET", "/readyz", { alive: () => true, indicators: [] }))?.status,
    ).toBe(200);
  });

  it("does not answer another route or method", async () => {
    const state = { alive: () => true, indicators: [] };
    expect(await answerProbe("GET", "/orders", state)).toBeUndefined();
    expect(await answerProbe("POST", "/healthz", state)).toBeUndefined();
  });
});
