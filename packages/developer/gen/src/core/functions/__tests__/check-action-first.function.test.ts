/**
 * Stackra file contract:
 * Purpose: unit tests of `checkActionFirst`: an action that takes another service's client, a sibling module's
 *          service or `ConnectionStore` and starts no workflow is warned (`action_without_workflow`); one that starts
 *          a workflow, a query with the same dependency, a same-module service and a sibling module's config are
 *          silent. A controller, command or listener that takes `WorkflowRunner` or a workflow class, or starts a
 *          workflow, is refused (`workflow_without_action`); another kind doing so is not. The commerce fixture, a
 *          clean service like the golden one, reports neither code.
 * Boundary: test only; runs on the commerce IR fixture with one class added or changed per case.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0101 (decisions 1 and 3, Enforcement, and its 0294 note).
 */
import { describe, expect, it } from "@stackra/testing";

import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { checkActionFirst } from "#core/functions/check-action-first.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { TokenRef } from "#core/types/token-ref.type";

const CLIENT: TokenRef = { class: { name: "BillingClient", from: "#stackra/clients/billing" } };
const STORE: TokenRef = { class: { name: "ConnectionStore", from: "@stackra/integrations" } };
const RUNNER: TokenRef = { class: { name: "WorkflowRunner", from: "@stackra/actions/contracts" } };
const SIBLING_SERVICE: TokenRef = {
  class: { name: "LedgerService", from: "#modules/ledger/services/ledger.service" },
};
const SIBLING_CONFIG: TokenRef = {
  class: { name: "LedgerConfig", from: "#modules/ledger/config/ledger.config" },
};
const OWN_SERVICE: TokenRef = {
  class: { name: "OrderService", from: "#modules/orders/services/order.service" },
};

/** A class of the `orders` module named `name` of `kind`, with `extra` over it. */
function declared(name: string, kind: string, extra: Partial<DeclaredClass> = {}): DeclaredClass {
  return {
    name,
    kind,
    module: "orders",
    file: `src/modules/orders/${kind}s/${name}.ts`,
    importPath: `#modules/orders/${kind}s/${name}`,
    options: {},
    deps: [],
    facets: [],
    methods: [],
    refusals: [],
    statics: {},
    traits: [],
    ...extra,
  };
}

/** The sibling `ledger` module's service and config, which an action of `orders` may inject. */
const LEDGER: readonly DeclaredClass[] = [
  {
    ...declared("LedgerService", "service"),
    module: "ledger",
    importPath: SIBLING_SERVICE.class.from,
  },
  {
    ...declared("LedgerConfig", "config"),
    module: "ledger",
    importPath: SIBLING_CONFIG.class.from,
  },
];

/** The findings of the commerce fixture with the ledger module and `added`, as `[severity, code, subject]`. */
function findings(...added: DeclaredClass[]): string[][] {
  return checkActionFirst({
    ...COMMERCE_IR,
    modules: [...COMMERCE_IR.modules, "ledger"],
    classes: [...COMMERCE_IR.classes, ...LEDGER, ...added],
  }).map((error) => [error.severity ?? "error", error.code, error.subject]);
}

describe("checkActionFirst", () => {
  it("reports nothing on a clean service", () => {
    expect(checkActionFirst(COMMERCE_IR)).toEqual([]);
    expect(findings()).toEqual([]);
  });

  it("warns an action that takes a client, a sibling module's service or ConnectionStore and starts no workflow", () => {
    expect(
      findings(
        declared("ChargeOrderAction", "action", { deps: [CLIENT] }),
        declared("PostOrderAction", "action", { deps: [OWN_SERVICE, SIBLING_SERVICE] }),
        declared("SyncOrderAction", "action", { deps: [STORE] }),
      ),
    ).toEqual([
      ["warning", "action_without_workflow", "ChargeOrderAction"],
      ["warning", "action_without_workflow", "PostOrderAction"],
      ["warning", "action_without_workflow", "SyncOrderAction"],
    ]);
    const [warning] = checkActionFirst({
      ...COMMERCE_IR,
      classes: [declared("ChargeOrderAction", "action", { deps: [CLIENT] })],
    });
    expect(warning?.message).toContain("BillingClient (#stackra/clients/billing)");
    expect(warning?.fix).toContain("ctx.run(");
  });

  it("is silent on an action that starts a workflow, a query, a same-module service and a sibling config", () => {
    expect(
      findings(
        declared("ChargeOrderAction", "action", { deps: [CLIENT], workflows: ["ChargeWorkflow"] }),
        declared("GetBalanceQuery", "query", { deps: [CLIENT, SIBLING_SERVICE, STORE] }),
        declared("ShipOrderAction", "action", { deps: [OWN_SERVICE, SIBLING_CONFIG] }),
      ),
    ).toEqual([]);
  });

  it("refuses a controller, command or listener that reaches a workflow directly", () => {
    expect(
      findings(
        declared("RefundOnPaidListener", "listener", { deps: [RUNNER] }),
        declared("RefundController", "controller", { workflows: ["RefundWorkflow"] }),
        declared("RefundCommand", "command", {
          deps: [{ class: { name: "RefundWorkflow", from: "#modules/orders/workflows/refund" } }],
        }),
      ),
    ).toEqual([
      ["error", "workflow_without_action", "RefundOnPaidListener"],
      ["error", "workflow_without_action", "RefundController"],
      ["error", "workflow_without_action", "RefundCommand"],
    ]);
  });

  it("leaves a kind outside the adapters alone", () => {
    expect(
      findings(
        declared("RefundService", "service", { deps: [RUNNER], workflows: ["RefundWorkflow"] }),
        declared("RefundOrderAction", "action", { deps: [RUNNER], workflows: ["RefundWorkflow"] }),
      ),
    ).toEqual([]);
  });
});
