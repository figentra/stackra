/**
 * Stackra file contract:
 * Purpose: unit tests of `registerListeners`: pairs are recorded per event class in order, and a pair registered again
 *          is kept once.
 * Boundary: test only; reads the internal registry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 4).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { DomainEvent } from "#core/bases/domain-event.base";
import { Listener } from "#core/bases/listener.base";
import { LISTENER_REGISTRY } from "#core/constants/listener-registry.constant";
import { registerListeners } from "#core/functions/register-listeners.function";

class StockLow extends DomainEvent {}

class OrderPaid extends DomainEvent {}

class AlertListener extends Listener {
  async handle(_event: StockLow): Promise<void> {}
}

class ReorderListener extends Listener {
  async handle(_event: StockLow): Promise<void> {}
}

beforeEach(() => {
  LISTENER_REGISTRY.clear();
});

describe(registerListeners, () => {
  it("records listeners per event class in order", () => {
    registerListeners([
      [StockLow, AlertListener],
      [OrderPaid, AlertListener],
      [StockLow, ReorderListener],
    ]);
    expect(LISTENER_REGISTRY.get(StockLow)).toEqual([AlertListener, ReorderListener]);
    expect(LISTENER_REGISTRY.get(OrderPaid)).toEqual([AlertListener]);
  });

  it("keeps a pair registered twice once", () => {
    registerListeners([[StockLow, AlertListener]]);
    registerListeners([[StockLow, AlertListener]]);
    expect(LISTENER_REGISTRY.get(StockLow)).toEqual([AlertListener]);
  });
});
