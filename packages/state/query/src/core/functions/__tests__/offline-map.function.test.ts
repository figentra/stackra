/**
 * Stackra file contract:
 * Purpose: unit tests of `offlineMap`: it looks a policy up by the action's class or its key (a conflict record holds
 *          the key), answers `undefined` for an online-only action, records the policies for the queue, and refuses an
 *          unreadable retention, an empty `onConflict` or a malformed cap at boot.
 * Boundary: test only; the actions are classes with a static key, as `@stackra/clients`' `actionRef` writes them, and
 *           the entries restate the template's console offline map.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0252 (decision 2); ADR 0059 (decision 3).
 */
import { ConflictResolution, IdMinting, OfflineMode, OfflinePrecondition } from "@stackra/actions";
import { describe, expect, it } from "@stackra/testing";

import { OFFLINE_POLICIES } from "#core/constants/offline-policies.constant";
import { offlineMap } from "#core/functions/offline-map.function";

class CreateOrderAction {
  static readonly key = "orders.order.create@1";
}

class ArchiveProductAction {
  static readonly key = "catalogue.product.archive@1";
}

class CancelOrderAction {
  static readonly key = "orders.order.cancel@1";
}

const Offline = offlineMap([
  {
    action: CreateOrderAction,
    mode: OfflineMode.Queue,
    idMinting: IdMinting.Client,
    precondition: OfflinePrecondition.None,
    retention: "72h",
    onConflict: [ConflictResolution.ServerWins, ConflictResolution.Manual],
  },
  {
    action: ArchiveProductAction,
    mode: OfflineMode.Queue,
    idMinting: IdMinting.Server,
    precondition: OfflinePrecondition.Version,
    retention: "24h",
    onConflict: [ConflictResolution.ServerWins, ConflictResolution.ClientRetry],
  },
]);

describe("offlineMap", () => {
  it("looks a policy up by the action's class or its key", () => {
    expect(Offline.for(CreateOrderAction)?.idMinting).toBe(IdMinting.Client);
    expect(Offline.for("catalogue.product.archive@1")?.onConflict).toEqual([
      ConflictResolution.ServerWins,
      ConflictResolution.ClientRetry,
    ]);
  });

  it("answers undefined for an online-only action", () => {
    expect(Offline.for(CancelOrderAction)).toBeUndefined();
    expect(Offline.for(CancelOrderAction)?.onConflict ?? [ConflictResolution.Manual]).toEqual([
      ConflictResolution.Manual,
    ]);
  });

  it("records the policies for the mutation queue", () => {
    expect(OFFLINE_POLICIES.get("orders.order.create@1")?.retention).toBe("72h");
    expect(OFFLINE_POLICIES.has("orders.order.cancel@1")).toBe(false);
  });

  it("refuses an unreadable retention or no resolution, recording nothing", () => {
    const entry = {
      action: CancelOrderAction,
      mode: OfflineMode.Queue,
      idMinting: IdMinting.Server,
      precondition: OfflinePrecondition.None,
      retention: "72h",
      onConflict: [ConflictResolution.Manual],
    };
    expect(() => offlineMap([{ ...entry, retention: "three days" }])).toThrow(RangeError);
    expect(() => offlineMap([{ ...entry, onConflict: [] }])).toThrow(RangeError);
    expect(OFFLINE_POLICIES.has("orders.order.cancel@1")).toBe(false);
  });

  it("refuses a cap with an unreadable window or a limit that is not a positive integer", () => {
    const entry = {
      action: CancelOrderAction,
      mode: OfflineMode.Queue,
      idMinting: IdMinting.Server,
      precondition: OfflinePrecondition.None,
      retention: "72h",
      onConflict: [ConflictResolution.Manual],
    };
    expect(() => offlineMap([{ ...entry, cap: { count: 3, window: "a day" } }])).toThrow(
      RangeError,
    );
    expect(() => offlineMap([{ ...entry, cap: { count: 0, window: "24h" } }])).toThrow(RangeError);
    expect(() => offlineMap([{ ...entry, cap: { amount: 1.5, window: "24h" } }])).toThrow(
      RangeError,
    );
    expect(OFFLINE_POLICIES.has("orders.order.cancel@1")).toBe(false);
    expect(
      offlineMap([{ ...entry, cap: { count: 3, window: "24h" } }]).for(CancelOrderAction)?.cap,
    ).toEqual({
      count: 3,
      window: "24h",
    });
    OFFLINE_POLICIES.delete("orders.order.cancel@1");
  });
});
