/**
 * Stackra file contract:
 * Purpose: `workspaceTemplate(options)`, the files of a minimal pnpm workspace root for a service written into a folder
 *          that has none: `package.json`, `pnpm-workspace.yaml` (`services/*` and exactly the catalogs the member
 *          names, the `stackra` one pinned to the running CLI's version) and `.npmrc` naming the Stackra registry.
 * Boundary: pure; returns text and writes nothing. `NEW_COMMAND` never calls it for a folder that already holds a
 *           `pnpm-workspace.yaml`.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 4); ADR 0453 (the registry); versions policy (catalogs, exact pins).
 */
import { stringify } from "yaml";

import { SERVICE_CATALOGS } from "#node/constants/service-catalogs.constant";
import { STACKRA_REGISTRY_NPMRC } from "#node/constants/stackra-registry-npmrc.constant";
import { sorted } from "#node/functions/sorted.function";
import type { TemplateFile } from "#node/types/template-file.type";

/** Entries ordered by key. */
const byKey = <T>(entries: Record<string, T>): Record<string, T> =>
  Object.fromEntries(sorted(Object.entries(entries), ([a], [b]) => a.localeCompare(b)));

/**
 * The files of a workspace root for a member with these dependencies.
 *
 * @param options - the running CLI's version and the member's dependency specifiers (`catalog:`, `catalog:<name>`).
 * @throws Error when the member names a catalog entry the CLI does not ship.
 * @example
 * workspaceTemplate({ cliVersion: "0.4.0", dependencies: { "@stackra/app": "catalog:stackra" } });
 */
export function workspaceTemplate(options: {
  readonly cliVersion: string;
  readonly dependencies: Readonly<Record<string, string>>;
}): readonly TemplateFile[] {
  const catalogs: Record<string, Record<string, string>> = {};
  for (const [name, specifier] of Object.entries(options.dependencies)) {
    if (!specifier.startsWith("catalog:")) continue;
    const catalog = specifier.slice("catalog:".length) || "default";
    const version = catalog === "stackra" ? options.cliVersion : SERVICE_CATALOGS[catalog]?.[name];
    if (version === undefined)
      throw new Error(`no version for ${name} in catalog ${catalog}: add it to SERVICE_CATALOGS`);
    (catalogs[catalog] ??= {})[name] = version;
  }
  const { default: shared, ...named } = catalogs;
  const workspace = {
    packages: ["services/*"],
    ...(shared !== undefined && { catalog: byKey(shared) }),
    catalogs: byKey(Object.fromEntries(Object.entries(named).map(([n, e]) => [n, byKey(e)]))),
  };
  return [
    {
      path: "package.json",
      content: `${JSON.stringify({ name: "workspace", version: "0.0.0", private: true }, null, 2)}\n`,
    },
    {
      path: "pnpm-workspace.yaml",
      content: [
        "# Stackra file contract:",
        "# Purpose: the workspace of this folder: its services and the version catalogs they resolve against.",
        "# Boundary: written once by `stackra new`; edit it freely afterwards.",
        stringify(workspace),
      ].join("\n"),
    },
    { path: ".npmrc", content: STACKRA_REGISTRY_NPMRC },
  ];
}
