/**
 * Stackra file contract:
 * Purpose: unit tests of `systemGraph`: a call resolves to the same repo's node first and across repos when only one
 *          node answers, an event edge runs from each publisher to its consumer, `usedBy` collects callers and package
 *          users, flow tags come from the flow steps (actors and providers are never gaps), and an unanswered call,
 *          an unpublished event, an ambiguous call, a flow naming no node and a duplicate id are gaps; merging two
 *          repo graphs equals one graph of both, and the output is sorted.
 * Boundary: test only; the nodes and flows are built by hand.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0452 (decisions 2 and 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { systemGraph } from "#core/functions/system-graph.function";
import type { GraphFlow } from "#core/types/graph-flow.type";
import type { GraphNode } from "#core/types/graph-node.type";

/** A node of `repo` named `member`. */
function node(repo: string, member: string, extra: Partial<GraphNode> = {}): GraphNode {
  return {
    member,
    package: `@${repo}/${member}`,
    layout: "service",
    modules: [],
    calls: [],
    eventsOut: [],
    eventsIn: [],
    tables: [],
    packages: [],
    drivers: [],
    id: `${repo}.${member}`,
    repo,
    path: `services/${member}`,
    usedBy: [],
    flows: [],
    ...extra,
  };
}

const OS = [
  node("os", "billing", { eventsOut: ["billing.invoice.paid.v1"] }),
  node("os", "identity"),
  node("os", "catalogue"),
];
const COMMERCE = [
  node("commerce", "sales", {
    calls: ["billing", "catalogue", "stock", "nowhere"],
    eventsIn: ["billing.invoice.paid.v1", "ghost.thing.happened.v1"],
    packages: ["@os/identity"],
  }),
  node("commerce", "stock"),
  node("commerce", "catalogue"),
];
const FLOW: GraphFlow = {
  id: "checkout",
  title: "Checkout",
  steps: [
    { from: "actor.shopper", to: "commerce.sales", kind: "call", label: "Pays" },
    { from: "commerce.sales", to: "provider.tap", kind: "call", label: "Charges" },
    {
      from: "os.billing",
      to: "commerce.sales",
      kind: "event",
      label: "Paid",
      event: "billing.invoice.paid.v1",
    },
    { from: "commerce.sales", to: "os.ledger", kind: "call", label: "Posts" },
  ],
};

describe("systemGraph", () => {
  it("resolves calls and events, derives usedBy and flow tags, and lists the gaps", () => {
    const graph = systemGraph([
      { nodes: OS, flows: [] },
      { nodes: COMMERCE, flows: [FLOW] },
    ]);
    expect(graph.version).toBe(1);
    expect(graph.repos).toEqual(["commerce", "os"]);
    expect(graph.nodes.map((entry) => entry.id)).toEqual([
      "commerce.catalogue",
      "commerce.sales",
      "commerce.stock",
      "os.billing",
      "os.catalogue",
      "os.identity",
    ]);
    expect(graph.edges).toEqual([
      { from: "commerce.sales", to: "commerce.catalogue", kind: "call" },
      { from: "commerce.sales", to: "commerce.stock", kind: "call" },
      { from: "commerce.sales", to: "os.billing", kind: "call" },
      { from: "os.billing", to: "commerce.sales", kind: "event", event: "billing.invoice.paid.v1" },
    ]);
    const byId = new Map(graph.nodes.map((entry) => [entry.id, entry]));
    expect(byId.get("os.billing")?.usedBy).toEqual(["commerce.sales"]);
    expect(byId.get("os.identity")?.usedBy).toEqual(["commerce.sales"]);
    expect(byId.get("commerce.sales")?.flows).toEqual(["checkout"]);
    expect(byId.get("os.billing")?.flows).toEqual(["checkout"]);
    expect(byId.get("os.catalogue")?.usedBy).toEqual([]);
    expect(graph.gaps).toEqual([
      "commerce.sales calls nowhere, which no node in the graph answers",
      "commerce.sales consumes ghost.thing.happened.v1, which no node publishes",
      "flow checkout names os.ledger, which is no node in the graph",
    ]);
  });

  it("reports an ambiguous call and duplicate ids, keeping the first", () => {
    const graph = systemGraph([
      { nodes: [node("app", "web", { calls: ["catalogue"] }), ...OS, ...COMMERCE], flows: [FLOW] },
      { nodes: [node("os", "billing", { tables: ["copy"] })], flows: [FLOW] },
    ]);
    expect(graph.gaps).toContain(
      "app.web calls catalogue, which os.catalogue and commerce.catalogue all answer",
    );
    expect(graph.gaps).toContain("node os.billing is declared twice; the first is kept");
    expect(graph.gaps).toContain("flow checkout is declared twice; the first is kept");
    expect(graph.nodes.find((entry) => entry.id === "os.billing")?.tables).toEqual([]);
  });

  it("merges repo graphs into the same graph as one pass over both", () => {
    const os = systemGraph([{ nodes: OS, flows: [] }]);
    const commerce = systemGraph([{ nodes: COMMERCE, flows: [FLOW] }]);
    expect(systemGraph([os, commerce])).toEqual(
      systemGraph([
        { nodes: OS, flows: [] },
        { nodes: COMMERCE, flows: [FLOW] },
      ]),
    );
    expect(commerce.gaps).toContain(
      "commerce.sales consumes billing.invoice.paid.v1, which no node publishes",
    );
  });
});
