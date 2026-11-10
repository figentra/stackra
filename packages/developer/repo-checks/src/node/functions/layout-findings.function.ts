/**
 * Stackra file contract:
 * Purpose: `layoutFindings(context)`, the layout phase of `stackra validate --repository`: reads the preset from
 *          flow.config.json (a preset folder by its `preset.yml` id, `presetTemplateKey`), the member folders from
 *          pnpm-workspace.yaml and the declared differences from package.json `stackra.layout.allow` and
 *          `stackra.layout.banned`, then runs `checkRepositoryLayout`.
 * Boundary: reads those three files; returns findings and never prints.
 * Runtime: node
 * Governing contract: ADR 0526 (decision 4); ADR 0528 (decision 2).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parse } from "yaml";

import { checkRepositoryLayout } from "#node/functions/check-repository-layout.function";
import { presetTemplateKey } from "#node/functions/preset-template-key.function";
import type { RawFinding } from "#node/types/raw-finding.type";
import type { RepoContext } from "#node/types/repo-context.type";

/** A JSON file's value, or an empty object when it is missing. */
const readJson = (path: string): Record<string, unknown> =>
  existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>) : {};

/**
 * The layout findings of the repository.
 *
 * @param context - the root and its file list.
 * @example
 * layoutFindings(readRepoContext(root));
 */
export function layoutFindings(context: RepoContext): RawFinding[] {
  const { root, files } = context;
  const flow = readJson(join(root, "flow.config.json"));
  const manifest = readJson(join(root, "package.json"));
  const workspace = join(root, "pnpm-workspace.yaml");
  const globs = existsSync(workspace)
    ? ((parse(readFileSync(workspace, "utf8")) as { packages?: string[] } | null)?.packages ?? [])
    : [];
  const stackra = (manifest["stackra"] ?? {}) as {
    layout?: { allow?: Record<string, string>; banned?: string[] };
  };
  return checkRepositoryLayout({
    entries: [...new Set(files.map((file) => file.split("/")[0] ?? file))],
    paths: files,
    preset: presetTemplateKey(
      root,
      typeof flow["preset"] === "string" ? flow["preset"] : "neutral",
    ),
    members: globs.map((glob) => glob.split("/")[0] ?? glob).filter((name) => name !== "apps"),
    allow: stackra.layout?.allow ?? {},
    banned: stackra.layout?.banned ?? [],
    toolsReadme: files.includes("tools/README.md"),
  }).map((text) => ({ rule: "layout", dir: "", text }));
}
