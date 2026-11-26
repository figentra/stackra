/**
 * Stackra file contract:
 * Purpose: `retargetCatalogs(manifest, workspace)`, a rendered member's package.json with every `catalog:<name>`
 *          dependency pointed at the catalog of the target workspace that holds it. The scaffold templates name
 *          core's catalogs (`catalog:frontend` for React) and core's own members (`workspace:*` for
 *          `@stackra/vitest-config`); a product made by `stackra create` keeps the same packages under its own
 *          catalog names (`catalog:` for React, `catalog:stackra` for the framework, as `memberNaming` writes), and
 *          `catalogMode: strict` refuses a name a catalog does not hold (STA-1954). A reference whose catalog already
 *          holds the package is kept, and so is a `workspace:` one no catalog holds (core's members); a catalog
 *          reference no catalog holds is kept too and named in `missing`, so `stackra new` can say which entries to
 *          add.
 * Boundary: pure; reads the workspace text it is given and returns a new manifest.
 * Runtime: node
 * Governing contract: ADR 0013 (versions come only from catalogs); ADR 0126 (scaffold templates); ADR 0515.
 */
import { parse } from "yaml";

import { sorted } from "#node/functions/sorted.function";

/** The dependency fields a catalog reference can sit in. */
const FIELDS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];

/** A catalog's name as `catalog:<name>` writes it: the default catalog is the empty name. */
const nameOf = (spec: string): string => {
  const name = spec.slice("catalog:".length);
  return name === "default" ? "" : name;
};

/** The workspace's catalogs: name (`""` for the default) to the package names it holds, default first. */
function catalogsOf(workspace: string): Map<string, Set<string>> {
  const parsed = (parse(workspace) ?? {}) as {
    catalog?: Record<string, unknown> | null;
    catalogs?: Record<string, Record<string, unknown> | null> | null;
  };
  const catalogs = new Map<string, Set<string>>([
    [
      "",
      new Set([
        ...Object.keys(parsed.catalog ?? {}),
        ...Object.keys(parsed.catalogs?.["default"] ?? {}),
      ]),
    ],
  ]);
  for (const [name, entries] of Object.entries(parsed.catalogs ?? {}))
    if (name !== "default") catalogs.set(name, new Set(Object.keys(entries ?? {})));
  return catalogs;
}

/**
 * The manifest with its catalog references retargeted to the workspace's catalogs.
 *
 * @param manifest - the rendered package.json.
 * @param workspace - the target's `pnpm-workspace.yaml` text.
 * @returns the new manifest and the `name@catalog:<name>` references no catalog of the workspace holds, sorted.
 * @example
 * retargetCatalogs({ dependencies: { react: "catalog:frontend" } }, "catalog:\n  react: 19.2.0\n");
 * // { manifest: { dependencies: { react: "catalog:" } }, missing: [] }
 */
export function retargetCatalogs(
  manifest: Readonly<Record<string, unknown>>,
  workspace: string,
): { manifest: Record<string, unknown>; missing: string[] } {
  const catalogs = catalogsOf(workspace);
  const missing: string[] = [];
  const out: Record<string, unknown> = { ...manifest };
  for (const field of FIELDS) {
    const deps = manifest[field];
    if (deps === null || typeof deps !== "object") continue;
    const next: Record<string, unknown> = {};
    for (const [dep, spec] of Object.entries(deps as Record<string, unknown>)) {
      next[dep] = spec;
      if (typeof spec !== "string") continue;
      const catalog = spec.startsWith("catalog:");
      if (!catalog && !spec.startsWith("workspace:")) continue;
      if (catalog && catalogs.get(nameOf(spec))?.has(dep)) continue;
      const holder = [...catalogs].find(([, names]) => names.has(dep))?.[0];
      if (holder !== undefined) next[dep] = `catalog:${holder}`;
      else if (catalog) missing.push(`${dep}@${spec}`);
    }
    out[field] = next;
  }
  return { manifest: out, missing: sorted(missing) };
}
