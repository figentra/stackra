/**
 * Stackra file contract:
 * Purpose: unit tests of `DatabaseHealthIndicatorDriver`: a `HealthIndicator` named `database` that runs select 1, reports `up` with a latency,
 *          and reports `down` (never throws) when the probe fails or runs past `health.timeout`, or `degraded` when
 *          `health.critical` is off; the detail names the error, never its message. With `health.rowSecurity`, it is
 *          `down` when the connected role can bypass row-level security or owns a table with it.
 * Boundary: test only; the `Database` is a fake that records every call, nothing leaves the process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 16 and
 *                     17); registry gap R-27.
 */
import { buildConfig } from "@stackra/config";
import { Duration, HealthIndicator } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DatabaseConfig } from "#config/database.config";
import type { Database } from "#core/ports/database.port";
import { DatabaseHealthIndicatorDriver } from "#node/drivers/database-health-indicator.driver";

/** Every call the fake `Database` received, with all its arguments. */
const calls: unknown[][] = [];

/** What the role probe answers. */
interface Role {
  readonly bypass: boolean;
  readonly owned: number;
  readonly system: boolean;
  readonly creates: boolean;
}

/** A runtime role with none of the rights the probe looks for. */
const SAFE: Role = { bypass: false, owned: 0, system: false, creates: false };

/**
 * An indicator over a fake whose probe resolves, rejects with `error`, or never settles (`"hang"`); the role probe
 * answers `role` (no row when it is undefined).
 */
function indicator(
  outcome: "answer" | Error | "hang",
  health: Partial<DatabaseConfig["health"]> = {},
  role: Role | undefined = SAFE,
): DatabaseHealthIndicatorDriver {
  const probe = (...args: unknown[]): Promise<unknown> => {
    calls.push(args);
    if (outcome === "hang") return new Promise(() => {});
    if (outcome !== "answer") return Promise.reject(outcome);
    return Promise.resolve(args[0] === "select 1" || role === undefined ? [] : [role]);
  };
  const port = { em: () => ({ execute: probe }) } as unknown as Database;
  const config = buildConfig(DatabaseConfig, {
    values: {
      health: { timeout: Duration.seconds(2), critical: true, rowSecurity: false, ...health },
    },
  });
  return new DatabaseHealthIndicatorDriver(port, config);
}

afterEach(() => {
  calls.length = 0;
  vi.useRealTimers();
});

describe("DatabaseHealthIndicatorDriver", () => {
  it("is a health indicator named database that runs select 1", async () => {
    const probe = indicator("answer");
    expect(probe).toBeInstanceOf(HealthIndicator);
    expect(probe.name).toBe("database");
    const report = await probe.check();
    expect(report.status).toBe("up");
    expect(report.latency).toMatch(/^P/);
    expect(calls).toEqual([["select 1"]]);
  });

  it("is down, without throwing, when the probe fails, naming the error but not its message", async () => {
    const report = await indicator(new TypeError("connect ECONNREFUSED secret.internal")).check();
    expect(report).toEqual({ status: "down", detail: "the database did not answer (TypeError)" });
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
      detail: "the database did not answer (TimeoutError)",
    });
  });

  it("reads no role unless rowSecurity is on", async () => {
    await indicator("answer").check();
    expect(calls).toEqual([["select 1"]]);
  });

  it("is up with rowSecurity when the role can't bypass row-level security", async () => {
    const report = await indicator("answer", { rowSecurity: true }).check();
    expect(report.status).toBe("up");
    expect(calls).toHaveLength(2);
    expect(String(calls[1]?.[0])).toContain("rolbypassrls");
  });

  it("is down, even when not critical, when the role can bypass row-level security", async () => {
    const report = await indicator(
      "answer",
      { rowSecurity: true, critical: false },
      { ...SAFE, bypass: true },
    ).check();
    expect(report).toEqual({
      status: "down",
      detail:
        "the database is open: its role can bypass row-level security (a superuser or BYPASSRLS)",
    });
  });

  it("is down when the role owns tables with row-level security", async () => {
    const report = await indicator("answer", { rowSecurity: true }, { ...SAFE, owned: 3 }).check();
    expect(report).toEqual({
      status: "down",
      detail: "the database is open: its role owns 3 tables with row-level security",
    });
  });

  it("is down when the role may act as the system-access role, or create roles or databases", async () => {
    const system = await indicator(
      "answer",
      { rowSecurity: true },
      { ...SAFE, system: true },
    ).check();
    expect(system).toEqual({
      status: "down",
      detail: "the database is open: its role may act as stackra_system_access",
    });
    const creates = await indicator(
      "answer",
      { rowSecurity: true },
      { ...SAFE, creates: true },
    ).check();
    expect(creates).toEqual({
      status: "down",
      detail: "the database is open: its role can create roles or databases",
    });
  });

  it("is down when the role can't be read", async () => {
    const report = await indicator("answer", { rowSecurity: true }, undefined).check();
    expect(report).toEqual({
      status: "down",
      detail: "the database is open: its role could not be read",
    });
  });
});
