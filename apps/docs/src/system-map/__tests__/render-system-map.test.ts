/**
 * Stackra file contract:
 * Purpose: unit tests of the system map renderer: from a graph `systemGraph` builds (two repos, a cross-repo call, an
 *          event, a driver, a flow with an actor and a provider) it renders level 1 (repos, cross-repo edge counts,
 *          flows, providers, gaps), level 2 (a sequence diagram and a step table per flow) and level 3 (a page per
 *          node with its edges, events, tables, packages, drivers, users and flows); an empty graph renders one page
 *          that says so; text that would break MDX or Mermaid is escaped; the output is deterministic; and
 *          `writeSystemMap` writes the pages and drops stale ones.
 * Boundary: test only; the graph comes from `@stackra/gen`'s `systemGraph`, so the renderer is tested on the real shape.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0452; STA-845; batch stackra-60.
 */
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { systemGraph } from "@stackra/gen";
import type { GraphFlow, GraphNode } from "@stackra/gen";
import { describe, expect, it } from "@stackra/testing";

import { renderSystemMap } from "../render-system-map";
import { writeSystemMap } from "../write-system-map";

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

const CHECKOUT: GraphFlow = {
  id: "checkout",
  title: "Checkout",
  summary: "A shopper pays for a cart.",
  steps: [
    { from: "actor.shopper", to: "commerce.sales", kind: "call", label: "places the order" },
    { from: "commerce.sales", to: "os.billing", kind: "call", label: "charges the card" },
    { from: "os.billing", to: "provider.stripe", kind: "call", label: "captures; the {amount}" },
    {
      from: "os.billing",
      to: "commerce.sales",
      kind: "event",
      label: "payment settled",
      event: "billing.payment.settled.v1",
      data: "amount | currency",
    },
  ],
};

const GRAPH = systemGraph([
  {
    nodes: [
      node("os", "billing", {
        modules: ["billing"],
        eventsOut: ["billing.payment.settled.v1"],
        tables: ["billing.payments"],
        packages: ["@stackra/money"],
        drivers: [{ port: "payments.PaymentGateway", candidates: ["tap", "stripe"] }],
      }),
    ],
    flows: [],
  },
  {
    nodes: [
      node("commerce", "sales", {
        calls: ["billing"],
        eventsIn: ["billing.payment.settled.v1"],
      }),
    ],
    flows: [CHECKOUT],
  },
]);

const page = (path: string): string =>
  renderSystemMap(GRAPH).find((item) => item.path === path)?.content ?? "";

describe("renderSystemMap", () => {
  it("renders one page per level: the system, each flow and each node", () => {
    expect(renderSystemMap(GRAPH).map((item) => item.path)).toEqual([
      "flows/checkout.mdx",
      "index.mdx",
      "services/commerce/sales.mdx",
      "services/os/billing.mdx",
    ]);
  });

  it("level 1 shows the repos, the cross-repo edges, flows, providers and gaps", () => {
    const index = page("index.mdx");
    expect(index).toContain('title: "System map"');
    expect(index).toContain("Stackra file contract");
    expect(index).toContain(GRAPH.$comment);
    expect(index).toContain('R0["commerce (1 members)"]');
    expect(index).toContain('R0 -->|"1 calls"| R1');
    expect(index).toContain('R1 -->|"1 events"| R0');
    expect(index).toContain("R1 -.->|drivers| P");
    expect(index).toContain("## os");
    expect(index).toContain("[`os.billing`](/system-map/services/os/billing)");
    expect(index).toContain("[Checkout](/system-map/flows/checkout)");
    expect(index).toContain("`payments.PaymentGateway` | `stripe`, `tap`");
    expect(index).toContain("## Gaps\n\nNone.");
  });

  it("level 2 is the flow step by step, actors and providers kept plain", () => {
    const flow = page("flows/checkout.mdx");
    expect(flow).toContain("sequenceDiagram");
    expect(flow).toContain("participant A0 as actor.shopper");
    expect(flow).toContain("A2->>A3: captures, the {amount}");
    expect(flow).toContain("A2--)A1: payment settled (billing.payment.settled.v1)");
    expect(flow).toContain("| 4 | [`os.billing`](/system-map/services/os/billing) |");
    expect(flow).toContain("`provider.stripe`");
    // The step label leaves the table as MDX-safe text.
    expect(flow).toContain("captures; the &#123;amount&#125;");
    expect(flow).toContain("amount \\| currency");
  });

  it("level 3 is one service: edges, events, tables, packages, drivers, users and flows", () => {
    const billing = page("services/os/billing.mdx");
    expect(billing).toContain('title: "os.billing"');
    expect(billing).toContain("N0 -->|call| S");
    expect(billing).toContain('S -.->|"billing.payment.settled.v1"| N0');
    expect(billing).toContain(
      "| `billing.payment.settled.v1` | [`commerce.sales`](/system-map/services/commerce/sales) |",
    );
    expect(billing).toContain("## Called by\n\n- [`commerce.sales`]");
    expect(billing).toContain("- `billing.payments`");
    expect(billing).toContain("- `@stackra/money`");
    expect(billing).toContain("| `payments.PaymentGateway` | `tap`, `stripe` |");
    expect(billing).toContain("## Flows\n\n- [Checkout](/system-map/flows/checkout)");
    const sales = page("services/commerce/sales.mdx");
    expect(sales).toContain("## Calls out\n\n- [`os.billing`]");
    expect(sales).toContain("| `billing.payment.settled.v1` | [`os.billing`]");
  });

  it("lists the gaps and serves a custom base", () => {
    const gapped = systemGraph([
      { nodes: [node("os", "orders", { calls: ["ghost"] })], flows: [] },
    ]);
    const [index] = renderSystemMap(gapped, { base: "/map" }).filter(
      (item) => item.path === "index.mdx",
    );
    expect(index?.content).toContain("- os.orders calls ghost, which no node in the graph answers");
    expect(index?.content).toContain("[`os.orders`](/map/services/os/orders)");
  });

  it("renders an empty graph as one page that says so", () => {
    const pages = renderSystemMap(systemGraph([]));
    expect(pages.map((item) => item.path)).toEqual(["index.mdx"]);
    expect(pages[0]?.content).toContain("The graph has no nodes yet");
  });

  it("is deterministic", () => {
    expect(renderSystemMap(GRAPH)).toEqual(renderSystemMap(GRAPH));
  });
});

describe("writeSystemMap", () => {
  it("writes the pages and removes stale generated pages, keeping other files", () => {
    const dir = mkdtempSync(join(tmpdir(), "system-map-"));
    const graphPath = join(dir, "system.graph.json");
    writeFileSync(graphPath, JSON.stringify(GRAPH));
    const out = join(dir, "map");
    mkdirSync(join(out, "flows"), { recursive: true });
    writeFileSync(join(out, "flows", "gone.mdx"), "stale");
    writeFileSync(join(out, "keep.ts"), "source");

    expect(writeSystemMap(graphPath, out)).toContain("services/os/billing.mdx");
    expect(existsSync(join(out, "flows", "gone.mdx"))).toBe(false);
    expect(existsSync(join(out, "keep.ts"))).toBe(true);
    expect(readFileSync(join(out, "index.mdx"), "utf8")).toContain("System map");
  });

  it("refuses a missing graph, invalid JSON and an unknown version with the path", () => {
    const dir = mkdtempSync(join(tmpdir(), "system-map-"));
    expect(() => writeSystemMap(join(dir, "none.json"), dir)).toThrow(/none\.json is missing/);
    writeFileSync(join(dir, "bad.json"), "{");
    expect(() => writeSystemMap(join(dir, "bad.json"), dir)).toThrow(/not valid JSON/);
    writeFileSync(join(dir, "v2.json"), JSON.stringify({ version: 2 }));
    expect(() => writeSystemMap(join(dir, "v2.json"), dir)).toThrow(/not a version 1/);
  });
});
