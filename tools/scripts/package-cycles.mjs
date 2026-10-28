#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the package-cycle check of `pnpm validate` (STA-1373, replacing BUILDER-RULES rule 6c as the enforcement):
 *          builds the workspace package graph from every member's package.json (dependencies, devDependencies,
 *          peerDependencies and optionalDependencies on another workspace member, whatever the specifier) and
 *          reports every cycle with its full path (`@stackra/a → @stackra/b → @stackra/a`). turbo refuses every task
 *          on a cyclic graph and pnpm only warns, so this names the cycle before either runs. Development
 *          dependencies count: turbo builds its graph from them too, and ADR 0003's one-way tier direction leaves no
 *          room for a cycle of any kind. Also exports the workspace member reader the architecture map shares.
 * Boundary: reads pnpm-workspace.yaml and each member's package.json; writes nothing. Run directly it prints the
 *           cycles and exits 1, or prints nothing and exits 0.
 * Runtime: node
 * Governing contract: ADR 0003 (tier dependency direction); ADR 0117; STA-1373.
 * Scope: every member the `packages` globs of pnpm-workspace.yaml match (a folder holding package.json).
 * Owner: release-operations · Secrets: forbidden
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { parse } from "yaml";

// oxlint-disable stackra/one-declaration-per-file -- reason: a plain-node script module run by pnpm validate, not member source (like spec-parse.mjs); its tests import these names

/** The package.json fields whose workspace names make a graph edge. */
export const DEPENDENCY_FIELDS = Object.freeze([
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
]);

/**
 * Expands one workspace glob into the folders it matches, relative to `root`.
 * shortcut: only literal and `*` segments (the globs pnpm-workspace.yaml uses); add `**` or negation when a glob needs it.
 */
function expand(root, pattern) {
  let dirs = [""];
  for (const segment of pattern.split("/").filter(Boolean)) {
    dirs = dirs.flatMap((dir) => {
      if (segment !== "*") return existsSync(join(root, dir, segment)) ? [join(dir, segment)] : [];
      if (!existsSync(join(root, dir))) return [];
      return readdirSync(join(root, dir), { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
        .map((entry) => join(dir, entry.name));
    });
  }
  return dirs;
}

/**
 * Every workspace member under `root`: its folder (repository-relative), name and parsed package.json, sorted by folder.
 *
 * @example
 * readWorkspaceMembers(root); // [{ dir: "apps/docs", name: "@figentra/docs", manifest: {...} }, ...]
 */
export function readWorkspaceMembers(root) {
  const { packages = [] } = parse(readFileSync(join(root, "pnpm-workspace.yaml"), "utf8")) ?? {};
  const dirs = new Set(
    packages.filter((glob) => !glob.startsWith("!")).flatMap((glob) => expand(root, glob)),
  );
  return [...dirs]
    .filter((dir) => existsSync(join(root, dir, "package.json")))
    .toSorted()
    .map((dir) => {
      const manifest = JSON.parse(readFileSync(join(root, dir, "package.json"), "utf8"));
      return { dir, name: manifest.name, manifest };
    })
    .filter((member) => typeof member.name === "string");
}

/**
 * The workspace package graph: each member name to the sorted workspace member names it depends on through any
 * DEPENDENCY_FIELDS entry.
 */
export function packageGraph(members) {
  const names = new Set(members.map((member) => member.name));
  const graph = new Map();
  for (const { name, manifest } of [...members].toSorted((a, b) => (a.name < b.name ? -1 : 1))) {
    const targets = new Set(
      DEPENDENCY_FIELDS.flatMap((field) => Object.keys(manifest[field] ?? {})).filter((dep) =>
        names.has(dep),
      ),
    );
    graph.set(name, [...targets].toSorted());
  }
  return graph;
}

/**
 * Every elementary cycle a depth-first walk meets, each as a path that starts at its smallest name and repeats it at
 * the end (`["a", "b", "a"]`), deduplicated and sorted.
 * shortcut: one cycle per back edge, not every elementary cycle of a large strongly connected component; enough to
 * name and break them one at a time.
 */
export function findPackageCycles(graph) {
  const state = new Map();
  const stack = [];
  const found = new Map();
  const visit = (name) => {
    state.set(name, "open");
    stack.push(name);
    for (const next of graph.get(name) ?? []) {
      if (state.get(next) === "open") {
        const loop = stack.slice(stack.indexOf(next));
        const start = loop.indexOf([...loop].toSorted()[0]);
        const path = [...loop.slice(start), ...loop.slice(0, start)];
        found.set(path.join("\u0000"), [...path, path[0]]);
      } else if (!state.has(next)) visit(next);
    }
    stack.pop();
    state.set(name, "done");
  };
  for (const name of [...graph.keys()].toSorted()) if (!state.has(name)) visit(name);
  return [...found.keys()].toSorted().map((key) => found.get(key));
}

/**
 * The validate findings (`{ dir, text }`, as @stackra/repo-checks reports them): one per package cycle under `root`.
 */
export function packageCycleFindings(root) {
  return findPackageCycles(packageGraph(readWorkspaceMembers(root))).map((cycle) => ({
    dir: "pnpm-workspace.yaml",
    text: `package cycle: ${cycle.join(" → ")} (break it: turbo refuses every task while it exists)`,
  }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const findings = packageCycleFindings(fileURLToPath(new URL("../../", import.meta.url)));
  for (const { dir, text } of findings) console.error(`${dir}: ${text}`);
  if (findings.length) process.exit(1);
}
