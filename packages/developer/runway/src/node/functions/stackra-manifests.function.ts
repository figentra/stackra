/**
 * Stackra file contract:
 * Purpose: `stackraManifests(root, members)`, every `stackra.manifest.json` a repository's runway files configure: each
 *          member's own, each package its `package.json` depends on (resolved from the member's `node_modules`, then
 *          the repository's), and each workspace package under `packages/`. `runway validate` reads their `env` rows
 *          for the fields only the runtime may set (`runtimeOnlyFields`, STA-2844).
 * Boundary: reads files only; a missing or unparsable manifest is skipped (gen and `pnpm validate` report those). Each
 *           manifest file is read once.
 * Runtime: node
 * Governing contract: ADR 0296 (amendment 2026-11-26); ADR 0173 (amendment 2026-11-04: env rows); STA-2844.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { workspacePackages } from "#node/functions/workspace-packages.function";
import type { DeployRunways } from "#node/types/deploy-runways.type";

/** The manifest file name. */
const MANIFEST = "stackra.manifest.json";

/** Parsed JSON of `file`, or undefined when it is missing or does not parse. */
function readJson(file: string): unknown {
  if (!existsSync(file)) return undefined;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as unknown;
  } catch {
    return undefined;
  }
}

/** The names `folder`'s package.json depends on (runtime and dev). */
function dependenciesOf(folder: string): string[] {
  const manifest = readJson(join(folder, "package.json")) as
    | { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
    | undefined;
  return [
    ...Object.keys(manifest?.dependencies ?? {}),
    ...Object.keys(manifest?.devDependencies ?? {}),
  ];
}

/**
 * The parsed manifests a repository's runway files configure.
 *
 * @param root - the repository root (it holds `runway.yaml`).
 * @param members - the member runways, from `readRunways`.
 * @example
 * runtimeOnlyFields(stackraManifests(root, readRunways(root).members));
 */
export function stackraManifests(root: string, members: DeployRunways["members"]): unknown[] {
  const files = new Set<string>();
  const folders = [
    root,
    ...members.map(({ member, folder = "apps" }) => join(root, folder, member)),
  ];
  for (const folder of folders) {
    files.add(resolve(folder, MANIFEST));
    for (const name of dependenciesOf(folder)) {
      const local = join(folder, "node_modules", name, MANIFEST);
      files.add(resolve(existsSync(local) ? local : join(root, "node_modules", name, MANIFEST)));
    }
  }
  for (const { dir } of workspacePackages(root).values()) files.add(resolve(dir, MANIFEST));
  return [...files].map((file) => readJson(file)).filter((manifest) => manifest !== undefined);
}
