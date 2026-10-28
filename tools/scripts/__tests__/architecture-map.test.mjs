/**
 * Stackra file contract:
 * Purpose: hold the architecture map generator (tools/scripts/architecture-map.mjs) to its contract: inputs from the
 *          `stackra` field and turbo.jsonc tags plus gen's call edges; a deterministic archify candidate (one region
 *          per tier, one box per app, service and worker member, one per library category); the drift check passes
 *          on a freshly written map and fails on the placeholder or a stale one.
 * Boundary: writes fixture workspaces into temp directories; reads nothing of this checkout.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0452; STA-1373.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

import {
  MAP_SOURCE,
  architectureMapFindings,
  readArchitectureInputs,
  renderArchitectureMap,
} from "../architecture-map.mjs";

const write = (root, path, text) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
};

/** A small workspace: a web app, a worker, two services that call each other once, three library packages. */
function workspace() {
  const root = mkdtempSync(join(tmpdir(), "architecture-map-"));
  write(
    root,
    "pnpm-workspace.yaml",
    "packages:\n  - apps/*\n  - packages/*/*\n  - services/*\n  - workers/*\n",
  );
  const member = (dir, name, stackra, tags) => {
    write(root, `${dir}/package.json`, JSON.stringify({ name, stackra }));
    write(
      root,
      `${dir}/turbo.jsonc`,
      `// tags\n{ "extends": ["//"], "tags": ${JSON.stringify(tags)}, }\n`,
    );
  };
  member("apps/web", "@figentra/web", { tier: "app", runtimes: ["browser"] }, [
    "tier:app",
    "runtime:browser",
  ]);
  member("workers/edge", "@figentra/worker-edge", {}, ["tier:app", "runtime:worker"]);
  member("services/orders", "@figentra/service-orders", { tier: "service" }, [
    "tier:service",
    "runtime:node",
  ]);
  member("services/billing", "@figentra/service-billing", { tier: "service" }, [
    "tier:service",
    "runtime:node",
  ]);
  member(
    "packages/data/model",
    "@stackra/model",
    { tier: "lib", category: "data", runtimes: ["isomorphic"] },
    ["tier:lib", "category:data", "runtime:node"],
  );
  member("packages/data/search", "@stackra/search", { tier: "lib", category: "data" }, [
    "tier:lib",
    "category:data",
  ]);
  member("packages/foundation/contracts", "@stackra/contracts", { tier: "lib" }, [
    "category:foundation",
  ]);
  write(
    root,
    "stackra.graph.json",
    JSON.stringify({
      nodes: [
        { id: "core.orders", package: "@figentra/service-orders" },
        { id: "core.billing", package: "@figentra/service-billing" },
      ],
      edges: [
        { from: "core.orders", to: "core.billing", kind: "call" },
        {
          from: "core.billing",
          to: "core.orders",
          kind: "event",
          event: "billing.invoice.paid.v1",
        },
        { from: "core.orders", to: "os.ledger", kind: "call" },
      ],
    }),
  );
  return root;
}

test("inputs merge the stackra field with the turbo.jsonc tags, and read only call edges", () => {
  const { members, calls } = readArchitectureInputs(workspace());
  const edge = members.find((member) => member.dir === "workers/edge");
  assert.deepEqual([edge.tier, edge.runtimes], ["app", ["worker"]]);
  const model = members.find((member) => member.dir === "packages/data/model");
  assert.deepEqual(model.runtimes, ["isomorphic", "node"]);
  assert.equal(
    members.find((member) => member.dir === "packages/foundation/contracts").category,
    "foundation",
  );
  assert.deepEqual(calls, [
    { from: "@figentra/service-orders", to: "@figentra/service-billing" },
    { from: "@figentra/service-orders", to: undefined },
  ]);
});

test("the map has a region per tier, a box per deployed member and per library category, and the call edge", () => {
  const map = renderArchitectureMap(readArchitectureInputs(workspace()));
  assert.deepEqual(
    map.boundaries.map((boundary) => [boundary.label, boundary.wraps]),
    [
      ["tier:app (apps and workers)", ["apps-web", "workers-edge"]],
      ["tier:service", ["services-billing", "services-orders"]],
      ["tier:lib (one box per category)", ["lib-data", "lib-foundation"]],
    ],
  );
  const data = map.components.find((component) => component.id === "lib-data");
  assert.deepEqual(
    [data.sublabel, data.tag, data.row, data.col],
    ["isomorphic, node", "2 packages", 2, 0],
  );
  assert.equal(map.components.find((component) => component.id === "workers-edge").type, "cloud");
  assert.deepEqual(map.connections, [
    {
      id: "call-services-orders-services-billing",
      from: "services-orders",
      to: "services-billing",
      label: "client call",
    },
  ]);
});

test("the same inputs in another order give the same map", () => {
  const inputs = readArchitectureInputs(workspace());
  const shuffled = { members: inputs.members.toReversed(), calls: inputs.calls.toReversed() };
  assert.deepEqual(renderArchitectureMap(shuffled), renderArchitectureMap(inputs));
});

test("the drift check fails on the placeholder and a stale map, and passes on a freshly written one", () => {
  const root = workspace();
  write(root, MAP_SOURCE, JSON.stringify({ placeholder: "PLACEHOLDER" }));
  assert.equal(architectureMapFindings(root).length, 1);
  const map = renderArchitectureMap(readArchitectureInputs(root));
  write(root, MAP_SOURCE, JSON.stringify(map));
  assert.deepEqual(architectureMapFindings(root), []);
  write(
    root,
    "packages/data/cache/package.json",
    JSON.stringify({ name: "@stackra/cache", stackra: { tier: "lib" } }),
  );
  assert.match(architectureMapFindings(root)[0].text, /out of date/);
});
