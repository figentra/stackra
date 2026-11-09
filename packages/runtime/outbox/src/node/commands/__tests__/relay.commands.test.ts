/**
 * Stackra file contract:
 * Purpose: proves `outbox:relay-deliveries` lists the cross-app deliveries with subscriber, type, state and error code,
 *          narrowed by `--subscriber` and `--state` (refusing another state), and says so when there are none; and
 *          `outbox:relay-replay` makes one dead delivery pending again and exits 2 for a live or unknown one. Each
 *          claimed delivery is loaded (or replayed) in its owner through the container's `CallIsolation`, read
 *          optionally; an owned delivery with no isolation bound fails the command, never skipped.
 * Boundary: test only; runs through `runCommandForTest` over a `MemoryDeliveryDriver` and a fixed clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0511 (decision 12); STA-1910 spec FR-014; ADR 0022 (test placement).
 */
import { runCommandForTest } from "@stackra/console/testing";
import { CallIsolation } from "@stackra/actions/contracts";
import type { Container } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { DeliveryState } from "#contracts/index";
import { DELIVERY_NOON as NOON, deliveryOf } from "#core/__tests__/fixtures/delivery.fixture";
import { MemoryDeliveryDriver } from "#core/drivers/memory-delivery.driver";
import { RelayDeliveriesCommand } from "#node/commands/relay-deliveries.command";
import { RelayReplayCommand } from "#node/commands/relay-replay.command";

class FixedClock extends Clock {
  now(): Date {
    return new Date(NOON);
  }
}

/** A memory store with a pending delivery to billing and a dead one to os, and the container serving the commands. */
async function setup(options: { owned?: string; isolation?: CallIsolation } = {}) {
  const driver = new MemoryDeliveryDriver();
  if (options.owned !== undefined) {
    const list = driver.list.bind(driver);
    driver.list = async (filter) =>
      (await list(filter)).map((claim) => ({ ...claim, ownerId: options.owned as never }));
  }
  const bound = {
    has: (token: unknown) => token === CallIsolation && options.isolation !== undefined,
    get: () => options.isolation,
  } as unknown as Container;
  await driver.write([
    deliveryOf(),
    deliveryOf({ id: "dlv_2", eventId: "evt_2", subscriber: "os" }),
  ]);
  await driver.deadLetter("dlv_2", { code: "http_status", status: 422 }, NOON);
  const container = () => ({
    get: <T extends object>(type: abstract new (...args: never[]) => T): T => {
      const args: unknown[] =
        type === (RelayReplayCommand as unknown)
          ? [driver, new FixedClock(), bound]
          : [driver, bound];
      return Reflect.construct(type, args) as T;
    },
    close: async () => {},
  });
  return { driver, container };
}

describe(RelayDeliveriesCommand, () => {
  it("lists every delivery with its state and error", async () => {
    const { container } = await setup();
    const result = await runCommandForTest([RelayDeliveriesCommand], ["outbox:relay-deliveries"], {
      container,
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("dlv_1");
    expect(result.stdout).toContain("pending");
    expect(result.stdout).toContain("dead");
    expect(result.stdout).toContain("http_status 422");
  });

  it("narrows by subscriber and state", async () => {
    const { container } = await setup();
    const result = await runCommandForTest(
      [RelayDeliveriesCommand],
      ["outbox:relay-deliveries", "--subscriber", "os", "--state", "dead"],
      { container },
    );
    expect(result.stdout).toContain("dlv_2");
    expect(result.stdout).not.toContain("dlv_1");
    const none = await runCommandForTest(
      [RelayDeliveriesCommand],
      ["outbox:relay-deliveries", "--subscriber", "billing", "--state", "failing"],
      { container },
    );
    expect(none.stdout).toContain("No deliveries");
  });

  it("refuses a state that does not exist", async () => {
    const { container } = await setup();
    const result = await runCommandForTest(
      [RelayDeliveriesCommand],
      ["outbox:relay-deliveries", "--state", "lost"],
      { container },
    );
    expect(result.exitCode).toBe(2);
  });
});

describe("the relay commands across owners", () => {
  it("loads and replays each owned delivery in its owner", async () => {
    const owners: unknown[] = [];
    const isolation = {
      run: (actor: Actor, _scope: unknown, work: () => Promise<unknown>) => {
        owners.push(actor.scopeId);
        return work();
      },
    } as unknown as CallIsolation;
    const { container } = await setup({ owned: "scp_acme", isolation });
    const listed = await runCommandForTest([RelayDeliveriesCommand], ["outbox:relay-deliveries"], {
      container,
    });
    expect(listed.stdout).toContain("dlv_1");
    const replayed = await runCommandForTest(
      [RelayReplayCommand],
      ["outbox:relay-replay", "dlv_2"],
      { container },
    );
    expect(replayed.exitCode).toBe(0);
    expect(owners).toEqual(["scp_acme", "scp_acme", "scp_acme"]);
  });

  it("fails on an owned delivery with no isolation bound", async () => {
    const { container } = await setup({ owned: "scp_acme" });
    const listed = await runCommandForTest([RelayDeliveriesCommand], ["outbox:relay-deliveries"], {
      container,
    });
    expect(listed.exitCode).not.toBe(0);
    expect(listed.stdout).not.toContain("dlv_1");
  });
});

describe(RelayReplayCommand, () => {
  it("replays a dead delivery", async () => {
    const { driver, container } = await setup();
    const result = await runCommandForTest([RelayReplayCommand], ["outbox:relay-replay", "dlv_2"], {
      container,
    });
    expect(result.exitCode).toBe(0);
    expect(await driver.list({ state: DeliveryState.Dead, limit: 10 })).toEqual([]);
    expect(await driver.lease(NOON, 10, NOON)).toHaveLength(2);
  });

  it("exits 2 for a live or unknown delivery", async () => {
    const { container } = await setup();
    for (const id of ["dlv_1", "dlv_9"]) {
      const result = await runCommandForTest([RelayReplayCommand], ["outbox:relay-replay", id], {
        container,
      });
      expect(result.exitCode).toBe(2);
    }
  });
});
