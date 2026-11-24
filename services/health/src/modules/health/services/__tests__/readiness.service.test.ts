/**
 * Stackra file contract:
 * Purpose: unit tests of `ReadinessService`: 200 when every check is up or degraded, 503 when one is down, a check that
 *          throws or runs past `PROBE_TIMEOUT_MS` is down, the body is a status per name and never a check's detail, the
 *          service's own migrations and pipeline checks gate readiness like any bound `HealthIndicator`, and a late
 *          binding is checked.
 * Boundary: test only; a stand-in `DiscoveryService` returns scripted indicators, the own checks are scripted too, and
 *           fake timers move the clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0190 (health); registry gap R-27.
 */
import type { DiscoveryService } from "@stackra/container";
import { HealthIndicator, HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PROBE_TIMEOUT_MS } from "#modules/health/constants/probe-timeout.constant";
import type { MigrationsCheckService } from "#modules/health/services/migrations-check.service";
import type { PipelineCheckService } from "#modules/health/services/pipeline-check.service";
import { ReadinessService } from "#modules/health/services/readiness.service";
import type { ReadinessCheck } from "#modules/health/types/readiness-check.type";

/** A check named `name` whose report is `check`'s. */
function check(name: string, run: () => Promise<HealthReport>): ReadinessCheck {
  return { name, check: run };
}

const up = (name: string) => check(name, async () => ({ status: HealthStatus.Up }));
const down = (name: string) => check(name, async () => ({ status: HealthStatus.Down }));

/** A readiness service over the bound indicators `list()` returns on each call and the two own checks. */
function serviceOf(
  list: () => ReadinessCheck[],
  own: { migrations?: ReadinessCheck; pipeline?: ReadinessCheck } = {},
): ReadinessService {
  const discovery = { getAll: (base: unknown) => (base === HealthIndicator ? list() : []) };
  return new ReadinessService(
    discovery as unknown as DiscoveryService,
    (own.migrations ?? up("migrations")) as unknown as MigrationsCheckService,
    (own.pipeline ?? up("pipeline")) as unknown as PipelineCheckService,
  );
}

afterEach(() => {
  vi.useRealTimers();
});

/** The readiness check. */
describe(ReadinessService, () => {
  /** Nothing down: ready, every check by name. */
  it("is ready with a status per check when none is down", async () => {
    const answer = await serviceOf(() => [up("database")]).check();
    expect(answer).toEqual({
      status: 200,
      body: { database: "up", migrations: "up", pipeline: "up" },
    });
  });

  /** No package indicator at all: the own checks still answer. */
  it("is ready on the own checks alone when no indicator is bound", async () => {
    expect(await serviceOf(() => []).check()).toEqual({
      status: 200,
      body: { migrations: "up", pipeline: "up" },
    });
  });

  /** A degraded dependency still serves. */
  it("stays ready when a dependency is degraded", async () => {
    const slow = check("cache", async () => ({ status: HealthStatus.Degraded }));
    const answer = await serviceOf(() => [up("database"), slow]).check();
    expect(answer.status).toBe(200);
    expect(answer.body["cache"]).toBe("degraded");
  });

  /** One bound indicator down is enough, and the body says which. */
  it("is not ready when a bound indicator is down, and says which", async () => {
    const answer = await serviceOf(() => [up("database"), down("queue")]).check();
    expect(answer).toEqual({
      status: 503,
      body: { database: "up", queue: "down", migrations: "up", pipeline: "up" },
    });
  });

  /** The service's own migrations check gates readiness. */
  it("is not ready when the migrations check is down", async () => {
    const answer = await serviceOf(() => [up("database")], {
      migrations: down("migrations"),
    }).check();
    expect(answer.status).toBe(503);
    expect(answer.body).toEqual({ database: "up", migrations: "down", pipeline: "up" });
  });

  /** The service's own pipeline check gates readiness. */
  it("is not ready when the pipeline check is down", async () => {
    const answer = await serviceOf(() => [], { pipeline: down("pipeline") }).check();
    expect(answer).toEqual({ status: 503, body: { migrations: "up", pipeline: "down" } });
  });

  /** A check that throws is down, never a thrown readiness check. */
  it("counts a check that throws as down", async () => {
    const broken = check("search", async () => {
      throw new Error("secret connection string postgres://user:pw@host");
    });
    const answer = await serviceOf(() => [broken]).check();
    expect(answer.status).toBe(503);
    expect(answer.body["search"]).toBe("down");
  });

  /** The body never carries a check's detail. */
  it("never puts a check's detail in the answer", async () => {
    const leaky = check("database", async () => ({
      status: HealthStatus.Down,
      detail: "password authentication failed for user admin",
    }));
    const answer = await serviceOf(() => [leaky]).check();
    expect(JSON.stringify(answer)).not.toContain("password");
    expect(answer.body["database"]).toBe("down");
  });

  /** A check that never answers is cut off at the cap and counts as down. */
  it("counts a check that outlasts the cap as down", async () => {
    vi.useFakeTimers();
    const hung = check("search", () => new Promise<HealthReport>(() => {}));
    const pending = serviceOf(() => [up("database"), hung]).check();
    await vi.advanceTimersByTimeAsync(PROBE_TIMEOUT_MS);
    const answer = await pending;
    expect(answer.status).toBe(503);
    expect(answer.body["search"]).toBe("down");
    expect(answer.body["database"]).toBe("up");
  });

  /** A check that answers just inside the cap is believed. */
  it("believes a check that answers inside the cap", async () => {
    vi.useFakeTimers();
    const slow = check(
      "queue",
      () =>
        new Promise<HealthReport>((resolve) => {
          setTimeout(() => {
            resolve({ status: HealthStatus.Up });
          }, PROBE_TIMEOUT_MS - 1);
        }),
    );
    const pending = serviceOf(() => [slow]).check();
    await vi.advanceTimersByTimeAsync(PROBE_TIMEOUT_MS);
    expect((await pending).status).toBe(200);
  });

  /** The indicators are read on each call, so one bound after boot is checked. */
  it("reads the bindings on every call", async () => {
    const bound: ReadinessCheck[] = [up("database")];
    const service = serviceOf(() => bound);
    expect((await service.check()).status).toBe(200);
    bound.push(down("late"));
    const answer = await service.check();
    expect(answer.status).toBe(503);
    expect(answer.body["late"]).toBe("down");
  });
});
