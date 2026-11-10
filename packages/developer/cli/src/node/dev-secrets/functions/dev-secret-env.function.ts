/**
 * Stackra file contract:
 * Purpose: `devSecretEnv(memberRoot)`, the variables a member's `stackra dev` run adds: the workspace dev-secrets
 *          file's values for the `secret` names the member's manifest declares (its packages' included) and the names its
 *          runway lists under `environments.dev.secrets`. The member's runtime reads each `@Secret` from its environment
 *          by name (`envSecrets`), so this is all a local boot needs.
 * Boundary: reads the member's manifest and runway and the file at the workspace root, which turbo's strict env mode
 *           would not pass down from a root run. Nothing without the file or without a name; never another member's.
 * Runtime: node
 * Governing contract: ADR 0525 (amendment of 2026-11-10); STA-2679.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { StackraManifest } from "@stackra/contracts";

import { DEV_SECRETS_FILE } from "#node/dev-secrets/constants/dev-secrets-file.constant";
import { readDevSecrets } from "#node/dev-secrets/functions/read-dev-secrets.function";
import { runwayDevSecretNames } from "#node/dev-secrets/functions/runway-dev-secret-names.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";

/**
 * The dev secret variables of the member at `memberRoot`.
 *
 * @param memberRoot - the absolute member folder a tool runs in.
 * @example
 * runProcess({ ...tool, env: { ...tool.env, ...devSecretEnv(cwd) } }, io);
 */
export function devSecretEnv(memberRoot: string): Readonly<Record<string, string>> {
  const manifest = join(memberRoot, "stackra.manifest.json");
  const rows = existsSync(manifest)
    ? ((JSON.parse(readFileSync(manifest, "utf8")) as StackraManifest).env ?? [])
    : [];
  const names = new Set([
    ...rows.filter((row) => row.kind === "secret").map((row) => row.name),
    ...runwayDevSecretNames(memberRoot),
  ]);
  if (names.size === 0) return {};
  const values = readDevSecrets(join(workspaceRoot(memberRoot), DEV_SECRETS_FILE));
  if (values === undefined) return {};
  return Object.fromEntries(
    [...names]
      .filter((name) => Object.hasOwn(values, name))
      .map((name) => [name, values[name] as string]),
  );
}
