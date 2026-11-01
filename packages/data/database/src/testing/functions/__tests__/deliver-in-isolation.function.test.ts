/**
 * Stackra file contract:
 * Purpose: unit tests of `deliverInIsolation`, the delivery scope `drainOutbox()` runs each event in (STA-1789): with a
 *          bound `CallIsolation`, a new transaction running as the event's actor in its scope, writable; the platform
 *          actor for an event that carries none; and `withScope` over the scope (or none) without an isolation.
 * Boundary: test only; a recording database and isolation stand in for the real ones.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0078 (decision 4).
 */
import { CallIsolation } from "@stackra/actions/contracts";
import type { TestingApp } from "@stackra/container/testing";
import { ActorKind } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import type { Database } from "#core/ports/database.port";
import { deliverInIsolation } from "#testing/functions/deliver-in-isolation.function";

const SCOPE = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2wa", path: "platform.acme" } as const;
const ACTOR = { kind: ActorKind.User, id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3" } as const;
const DONE = [{ ran: true }] as never;

/** What the recording database and isolation were asked, in order. */
let steps: unknown[] = [];

/** Connects a database that records its transactions and scopes and runs the work. */
function connectDatabase(): void {
  ACTIVE_DATABASE.current = {
    transaction: async (work: () => Promise<unknown>, options?: unknown) => {
      steps.push(["transaction", options]);
      return work();
    },
    withScope: async (scopes: unknown, work: () => Promise<unknown>) => {
      steps.push(["withScope", scopes]);
      return work();
    },
  } as unknown as Database;
}

/** A testing app that binds `isolation` when given. */
function appWith(isolation?: object): TestingApp {
  return {
    has: (type: unknown) => isolation !== undefined && type === CallIsolation,
    get: () => isolation,
  } as unknown as TestingApp;
}

/** An isolation that records each run. */
const recordingIsolation = {
  run: async (actor: unknown, scope: unknown, work: () => Promise<unknown>, options: unknown) => {
    steps.push(["run", actor, scope, options]);
    return work();
  },
};

afterEach(() => {
  ACTIVE_DATABASE.current = undefined;
  steps = [];
});

describe(deliverInIsolation, () => {
  it("runs a delivery in a new transaction, as the event's actor in its scope", async () => {
    connectDatabase();
    const result = await deliverInIsolation(
      appWith(recordingIsolation),
      { id: "evt_1", actor: ACTOR },
      SCOPE,
      async () => {
        steps.push(["work"]);
        return DONE;
      },
    );
    expect(result).toBe(DONE);
    expect(steps).toEqual([
      ["transaction", { requiresNew: true }],
      ["run", ACTOR, SCOPE, { readOnly: false }],
      ["work"],
    ]);
  });

  it("runs an event without an actor as the platform", async () => {
    connectDatabase();
    await deliverInIsolation(
      appWith(recordingIsolation),
      { id: "evt_2" },
      undefined,
      async () => DONE,
    );
    expect(steps[1]).toEqual([
      "run",
      { kind: ActorKind.System, id: "sys_inbox" },
      undefined,
      { readOnly: false },
    ]);
  });

  it("falls back to withScope when the app binds no isolation", async () => {
    connectDatabase();
    await deliverInIsolation(appWith(), { id: "evt_3" }, SCOPE, async () => DONE);
    await deliverInIsolation(appWith(), { id: "evt_4" }, undefined, async () => DONE);
    expect(steps).toEqual([
      ["withScope", SCOPE],
      ["withScope", []],
    ]);
  });
});
