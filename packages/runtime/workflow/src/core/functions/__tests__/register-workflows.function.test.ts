/**
 * Stackra file contract:
 * Purpose: unit tests of `registerWorkflows`: it registers workflow, signal and awaited event classes under their keys
 *          both ways, keeps each workflow version of one key (the key naming the highest), replaces a class's earlier
 *          key, and refuses another kind, an empty key or a key (and version) another class holds.
 * Boundary: test only; reads the process-wide registry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 20 and 22).
 */
import { DomainEvent } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";

import { Signal } from "#core/bases/signal.base";
import { Workflow } from "#core/bases/workflow.base";
import { WORKFLOW_KEYS } from "#core/constants/workflow-keys.constant";
import { registerWorkflows } from "#core/functions/register-workflows.function";

class ShipWorkflow extends Workflow({}) {}

class Shipped extends Signal {}

class OtherWorkflow extends Workflow({}) {}

describe(registerWorkflows, () => {
  it("registers workflows and signals under their keys, both ways", () => {
    registerWorkflows([
      { type: ShipWorkflow, key: "orders.ship" },
      { type: Shipped, key: "orders.shipped" },
    ]);
    expect(WORKFLOW_KEYS.byKey.get("orders.ship")).toBe(ShipWorkflow);
    expect(WORKFLOW_KEYS.keys.get(Shipped)).toBe("orders.shipped");
  });

  it("replaces a class's earlier key", () => {
    registerWorkflows([{ type: ShipWorkflow, key: "orders.ship_order" }]);
    expect(WORKFLOW_KEYS.byKey.has("orders.ship")).toBe(false);
    expect(WORKFLOW_KEYS.keys.get(ShipWorkflow)).toBe("orders.ship_order");
  });

  it("refuses another kind, an empty key and a key another class holds", () => {
    class Plain {}
    expect(() => registerWorkflows([{ type: Plain, key: "plain" }])).toThrow(TypeError);
    expect(() => registerWorkflows([{ type: OtherWorkflow, key: "" }])).toThrow(TypeError);
    expect(() => registerWorkflows([{ type: OtherWorkflow, key: "orders.ship_order" }])).toThrow(
      TypeError,
    );
  });
});

describe("registerWorkflows versions and events", () => {
  class RedeemWorkflow extends Workflow({}) {}

  class RedeemV2Workflow extends Workflow({ version: 2 }) {}

  class RedeemCopyWorkflow extends Workflow({ version: 2 }) {}

  class PointsExpired extends DomainEvent {}

  it("keeps each version of one key, the key naming the highest", () => {
    registerWorkflows([
      { type: RedeemV2Workflow, key: "points.redeem" },
      { type: RedeemWorkflow, key: "points.redeem" },
    ]);
    expect(WORKFLOW_KEYS.versions.get("points.redeem@1")).toBe(RedeemWorkflow);
    expect(WORKFLOW_KEYS.versions.get("points.redeem@2")).toBe(RedeemV2Workflow);
    expect(WORKFLOW_KEYS.byKey.get("points.redeem")).toBe(RedeemV2Workflow);
    expect(() => registerWorkflows([{ type: RedeemCopyWorkflow, key: "points.redeem" }])).toThrow(
      /share the key/,
    );
  });

  it("registers an event a step waits for", () => {
    registerWorkflows([{ type: PointsExpired, key: "points.expired" }]);
    expect(WORKFLOW_KEYS.keys.get(PointsExpired)).toBe("points.expired");
  });
});
