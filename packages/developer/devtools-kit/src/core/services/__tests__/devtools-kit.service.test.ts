/**
 * Stackra file contract:
 * Purpose: unit tests of `DevtoolsKit`: tabs and RPC functions are defined, replaced, sorted and removed; names are
 *          checked; the stream is stamped, sequenced, bounded and replayed; every event the bus delivers reaches the
 *          `bus` channel; one host attaches at a time, sees only the tabs it may, is told about changes, reads tabs and
 *          calls RPC functions, and loses its session on detach; a throwing host callback never reaches the caller.
 * Boundary: test only; a fixed clock stands in for the Clock port and a real `EventBus` carries the events.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0246 (decisions 1 to 4).
 */
import type { Clock } from "@stackra/contracts";
import { DomainEvent, EventBus } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DEVTOOLS_BUFFER_SIZE } from "#core/constants/devtools-buffer-size.constant";
import { DEVTOOLS_BUS_CHANNEL } from "#core/constants/devtools-bus-channel.constant";
import { DevtoolsError } from "#core/errors/devtools.error";
import { DevtoolsKit } from "#core/services/devtools-kit.service";
import type { DevtoolsBusOccurrence } from "#core/types/devtools-bus-occurrence.type";

const NOW = new Date("2026-10-24T09:00:00Z");

const clock = { now: () => new Date(NOW) } as Clock;

class OrderPaid extends DomainEvent {}

/** An RPC function compared by identity. */
const answerOne = () => 1;

/** A host callback with a bug. */
const hostBug = () => {
  throw new Error("host bug");
};

/** A kit on its own bus. */
function setup() {
  const bus = new EventBus(clock);
  return { bus, kit: new DevtoolsKit(bus, clock) };
}

/** The `DevtoolsError` code `run` throws, or `undefined`. */
function codeOf(run: () => unknown): string | undefined {
  try {
    run();
  } catch (error) {
    if (error instanceof DevtoolsError) return error.code;
    throw error;
  }
  return undefined;
}

describe(DevtoolsKit, () => {
  describe("tabs", () => {
    it("lists every tab by order then id, without its read function", () => {
      const { kit } = setup();
      kit.defineTab({ id: "router.tree", title: "Routes", read: () => [] });
      kit.defineTab({ id: "container.graph", title: "Graph", order: -1, read: () => ({}) });
      kit.defineTab({ id: "cache.keys", title: "Keys", sensitive: true, read: () => [] });

      expect(kit.tabs()).toEqual([
        { id: "container.graph", title: "Graph", order: -1 },
        { id: "cache.keys", title: "Keys", sensitive: true },
        { id: "router.tree", title: "Routes" },
      ]);
    });

    it("replaces a tab with the same id, and the old remover then does nothing", () => {
      const { kit } = setup();
      const removeOld = kit.defineTab({ id: "router.tree", title: "Old", read: () => 1 });
      const removeNew = kit.defineTab({ id: "router.tree", title: "New", read: () => 2 });

      removeOld();
      expect(kit.tabs()).toEqual([{ id: "router.tree", title: "New" }]);
      removeNew();
      removeNew();
      expect(kit.tabs()).toEqual([]);
    });

    it("refuses a malformed tab id", () => {
      const { kit } = setup();

      expect(codeOf(() => kit.defineTab({ id: "Router Tree", title: "x", read: () => 1 }))).toBe(
        "invalid_name",
      );
    });
  });

  describe("RPC functions", () => {
    it("lists names sorted, replaces by name and removes only its own definition", () => {
      const { kit } = setup();
      const removeFirst = kit.defineRpc("router.match", answerOne);
      kit.defineRpc("container.explain", () => "why");
      kit.defineRpc("router.match", () => 2);

      expect(kit.rpcNames()).toEqual(["container.explain", "router.match"]);
      removeFirst();
      expect(kit.rpcNames()).toEqual(["container.explain", "router.match"]);
    });

    it("refuses a malformed name", () => {
      const { kit } = setup();

      expect(codeOf(() => kit.defineRpc("router.", () => 1))).toBe("invalid_name");
    });
  });

  describe("stream", () => {
    it("stamps, sequences and freezes each entry", () => {
      const { kit } = setup();
      const first = kit.emit("cache.hit", { key: "a" });
      const second = kit.emit("cache.miss", { key: "b" });

      expect(first).toEqual({ sequence: 1, channel: "cache.hit", payload: { key: "a" }, at: NOW });
      expect(second.sequence).toBe(2);
      expect(Object.isFrozen(first)).toBe(true);
    });

    it("refuses a malformed channel", () => {
      const { kit } = setup();

      expect(codeOf(() => kit.emit("Cache Hit", 1))).toBe("invalid_name");
    });

    it("keeps only the newest entries for replay", () => {
      const { kit } = setup();
      for (let index = 0; index < DEVTOOLS_BUFFER_SIZE + 2; index += 1)
        kit.emit("cache.hit", index);
      const { session } = kit.attach({ name: "test-host" });
      const replay = session.replay();

      expect(replay).toHaveLength(DEVTOOLS_BUFFER_SIZE);
      expect(replay[0]?.payload).toBe(2);
      expect(replay.at(-1)?.sequence).toBe(DEVTOOLS_BUFFER_SIZE + 2);
    });

    it("reports every event the bus delivers on the bus channel", async () => {
      const { bus, kit } = setup();
      const event = new OrderPaid();
      bus.dispatch(event, { id: "evt_1", tenantId: "tnt_1", correlationId: "cor_1" });

      const { session } = kit.attach({ name: "test-host" });
      expect(session.replay(DEVTOOLS_BUS_CHANNEL)).toEqual([]);
      await bus.drain();

      const [entry] = session.replay(DEVTOOLS_BUS_CHANNEL);
      const occurrence = entry?.payload as DevtoolsBusOccurrence;
      expect(occurrence.type).toBe("OrderPaid");
      expect(occurrence.event).toBe(event);
      expect(occurrence.context).toEqual({
        eventId: "evt_1",
        occurredAt: NOW,
        tenantId: "tnt_1",
        correlationId: "cor_1",
      });
    });
  });

  describe("host", () => {
    it("allows one host at a time, and another after detach", () => {
      const { kit } = setup();
      const first = kit.attach({ name: "panel" });

      expect(codeOf(() => kit.attach({ name: "console" }))).toBe("host_attached");
      first.detach();
      first.detach();
      expect(() => kit.attach({ name: "console" })).not.toThrow();
    });

    it("withholds sensitive tabs unless the host accepts them", async () => {
      const { kit } = setup();
      kit.defineTab({ id: "cache.keys", title: "Keys", sensitive: true, read: () => ["k"] });
      kit.defineTab({ id: "router.tree", title: "Routes", read: async () => ["/"] });

      const plain = kit.attach({ name: "remote" });
      expect(plain.session.tabs().map((tab) => tab.id)).toEqual(["router.tree"]);
      await expect(plain.session.readTab("router.tree")).resolves.toEqual(["/"]);
      await expect(plain.session.readTab("cache.keys")).rejects.toMatchObject({
        code: "unknown_tab",
      });
      plain.detach();

      const local = kit.attach({ name: "local", acceptsSensitive: true });
      expect(local.session.tabs().map((tab) => tab.id)).toEqual(["cache.keys", "router.tree"]);
      await expect(local.session.readTab("cache.keys")).resolves.toEqual(["k"]);
    });

    it("calls RPC functions with the host's arguments", async () => {
      const { kit } = setup();
      kit.defineRpc("router.match", async (path) => `matched ${String(path)}`);
      const { session } = kit.attach({ name: "panel" });

      expect(session.rpcNames()).toEqual(["router.match"]);
      await expect(session.call("router.match", "/orders")).resolves.toBe("matched /orders");
      await expect(session.call("router.nope")).rejects.toMatchObject({ code: "unknown_rpc" });
    });

    it("pushes stream entries and registry changes to the host", () => {
      const { kit } = setup();
      const onEvent = vi.fn();
      const onTabsChanged = vi.fn();
      const onRpcChanged = vi.fn();
      kit.attach({ name: "panel", onEvent, onTabsChanged, onRpcChanged });

      const entry = kit.emit("cache.hit", 1);
      const removeTab = kit.defineTab({ id: "router.tree", title: "Routes", read: () => [] });
      kit.defineTab({ id: "cache.keys", title: "Keys", sensitive: true, read: () => [] });
      kit.defineRpc("router.match", () => null);
      removeTab();

      expect(onEvent).toHaveBeenCalledWith(entry);
      expect(onTabsChanged.mock.calls).toEqual([
        [[{ id: "router.tree", title: "Routes" }]],
        [[{ id: "router.tree", title: "Routes" }]],
        [[]],
      ]);
      expect(onRpcChanged).toHaveBeenCalledWith(["router.match"]);
    });

    it("ignores a host callback that throws", () => {
      const { kit } = setup();
      kit.attach({
        name: "panel",
        onEvent: hostBug,
        onTabsChanged: hostBug,
        onRpcChanged: hostBug,
      });

      expect(() => kit.emit("cache.hit", 1)).not.toThrow();
      expect(() =>
        kit.defineTab({ id: "router.tree", title: "Routes", read: () => [] }),
      ).not.toThrow();
      expect(() => kit.defineRpc("router.match", () => null)).not.toThrow();
    });

    it("ends the session on detach and stops pushing to the host", async () => {
      const { kit } = setup();
      const onEvent = vi.fn();
      const { session, detach } = kit.attach({ name: "panel", onEvent });
      detach();
      kit.emit("cache.hit", 1);

      expect(onEvent).not.toHaveBeenCalled();
      expect(codeOf(() => session.tabs())).toBe("detached");
      expect(codeOf(() => session.rpcNames())).toBe("detached");
      expect(codeOf(() => session.replay())).toBe("detached");
      await expect(session.readTab("router.tree")).rejects.toMatchObject({ code: "detached" });
      await expect(session.call("router.match")).rejects.toMatchObject({ code: "detached" });
    });
  });
});
