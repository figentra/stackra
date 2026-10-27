/**
 * Stackra file contract:
 * Purpose: unit tests of `writeRepoGraph` and `mergeSystemGraphs`: every member's `.stackra/graph.json` under the repo
 *          is found (never under `node_modules`), stamped with the repo and its folder, joined with the repo's
 *          `stackra.flows.json` and written as `stackra.graph.json`; two repo graphs merge into one system graph whose
 *          cross-repo call resolves; a malformed flow file and a missing repo graph fail with the path.
 * Boundary: test only; writes small fixtures under `<gen>/.cache/` (gitignored).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0452.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import type { MemberGraph } from "#core/types/member-graph.type";
import { mergeSystemGraphs } from "#node/functions/merge-system-graphs.function";
import { writeRepoGraph } from "#node/functions/write-repo-graph.function";

/** The gen package root. */
const GEN_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
let written = 0;

/** A fresh repo folder named `name` under `.cache/`. */
function repo(name: string): string {
  written += 1;
  const root = join(GEN_ROOT, ".cache", "graphs", `${process.pid}-${written}`, name);
  mkdirSync(root, { recursive: true });
  return root;
}

/** Writes `path` (relative to `root`) with `value` as JSON. */
function put(root: string, path: string, value: unknown): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), JSON.stringify(value));
}

/** A member graph of `member`. */
function member(name: string, extra: Partial<MemberGraph> = {}): MemberGraph {
  return {
    member: name,
    package: `@acme/${name}`,
    layout: "service",
    modules: [],
    calls: [],
    eventsOut: [],
    eventsIn: [],
    tables: [],
    packages: [],
    drivers: [],
    ...extra,
  };
}

describe("writeRepoGraph", () => {
  it("writes the repo graph from the member graphs and the flow file", () => {
    const root = repo("os");
    put(root, "services/billing/.stackra/graph.json", member("billing"));
    put(root, "packages/money/.stackra/graph.json", member("money", { layout: "package" }));
    put(root, "node_modules/@acme/x/.stackra/graph.json", member("x"));
    put(root, "stackra.flows.json", {
      flows: [
        {
          id: "pay",
          title: "Pay",
          steps: [{ from: "actor.payer", to: "os.billing", kind: "call", label: "Pays" }],
        },
      ],
    });
    const graph = writeRepoGraph(root, "os");
    expect(graph.nodes.map((entry) => [entry.id, entry.path, entry.flows])).toEqual([
      ["os.billing", "services/billing", ["pay"]],
      ["os.money", "packages/money", []],
    ]);
    expect(JSON.parse(readFileSync(join(root, "stackra.graph.json"), "utf8"))).toEqual(graph);
  });

  it("refuses a flow file without a flows array", () => {
    const root = repo("os");
    put(root, "stackra.flows.json", { flow: [] });
    expect(() => writeRepoGraph(root, "os")).toThrow("stackra.flows.json must hold");
  });
});

describe("mergeSystemGraphs", () => {
  it("merges repo graphs so a call across repos resolves", () => {
    const os = repo("os");
    put(os, "services/billing/.stackra/graph.json", member("billing"));
    writeRepoGraph(os, "os");
    const commerce = repo("commerce");
    put(commerce, "services/sales/.stackra/graph.json", member("sales", { calls: ["billing"] }));
    expect(writeRepoGraph(commerce, "commerce").gaps).toEqual([
      "commerce.sales calls billing, which no node in the graph answers",
    ]);
    const out = join(dirname(os), "system.graph.json");
    const graph = mergeSystemGraphs(
      [join(os, "stackra.graph.json"), join(commerce, "stackra.graph.json")],
      out,
    );
    expect(graph.repos).toEqual(["commerce", "os"]);
    expect(graph.edges).toEqual([{ from: "commerce.sales", to: "os.billing", kind: "call" }]);
    expect(graph.gaps).toEqual([]);
    expect(JSON.parse(readFileSync(out, "utf8"))).toEqual(graph);
  });

  it("fails on a missing repo graph", () => {
    expect(() =>
      mergeSystemGraphs([join(repo("os"), "stackra.graph.json")], join(repo("x"), "out.json")),
    ).toThrow("is missing");
  });
});
