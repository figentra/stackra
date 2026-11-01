/**
 * Stackra file contract:
 * Purpose: `checkToolPins(miseToml, workspaceYaml)`, the `tool-pins` rule: every `"npm:<name>" = "<version>"` pin in
 *          `mise.toml` (the commit hooks' oxlint and oxfmt) names a package a `pnpm-workspace.yaml` catalog pins at the
 *          same version, so the hooks and the members never run two versions (STA-1865).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0027 (tools pinned in mise); the versions rule (catalogs are the one source); STA-1865.
 */
import { parse } from "yaml";

/** `"npm:<name>" = "<version>"` in mise.toml's `[tools]`. */
const NPM_PIN = /^\s*"npm:([^"]+)"\s*=\s*"([^"]+)"/gm;

/**
 * The findings for mise npm pins that no catalog pins at the same version.
 *
 * @param miseToml - `mise.toml`'s text; undefined when the file is missing.
 * @param workspaceYaml - `pnpm-workspace.yaml`'s text; undefined when the file is missing.
 * @example
 * checkToolPins('"npm:oxlint" = "1.2.0"\n', "catalog:\n  oxlint: 1.1.0\n"); // ["mise.toml pins oxlint 1.2.0; …"]
 */
export function checkToolPins(miseToml?: string, workspaceYaml?: string): string[] {
  const pins = [...(miseToml ?? "").matchAll(NPM_PIN)].map(([, name, version]) => ({
    name,
    version,
  }));
  if (pins.length === 0) return [];
  const workspace = (parse(workspaceYaml ?? "") ?? {}) as {
    readonly catalog?: Readonly<Record<string, unknown>>;
    readonly catalogs?: Readonly<Record<string, Readonly<Record<string, unknown>> | null>>;
  };
  const catalogs = [
    workspace.catalog ?? {},
    ...Object.values(workspace.catalogs ?? {}).map((c) => c ?? {}),
  ];
  return pins.flatMap(({ name, version }) => {
    const pinned = catalogs.map((c) => c[name ?? ""]).filter((v) => v !== undefined);
    if (pinned.length === 0)
      return [
        `mise.toml pins npm:${name} ${version}, but no pnpm-workspace.yaml catalog pins ${name}`,
      ];
    return pinned.some((v) => String(v) === version)
      ? []
      : [
          `mise.toml pins ${name} ${version}; the catalog pins ${pinned.map(String).join(", ")} (keep them in step)`,
        ];
  });
}
