/**
 * Stackra file contract:
 * Purpose: `devSecretEnv(memberRoot)`, the variables a member's `stackra dev` run adds: the workspace dev-secrets
 *          file's values for the `secret` names the member's manifest declares, its packages' included. The member's
 *          runtime reads each `@Secret` from its environment by name (`envSecrets`), so this is all a local boot needs.
 * Boundary: reads the member's manifest and the file at the workspace root, which turbo's strict env mode would not
 *           pass down from a root run. Nothing when either is missing; never another member's names.
 * Runtime: node
 * Governing contract: ADR 0525 (amendment of 2026-11-10); STA-2679.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { StackraManifest } from "@stackra/contracts";

import { DEV_SECRETS_FILE } from "#node/dev-secrets/constants/dev-secrets-file.constant";
import { readDevSecrets } from "#node/dev-secrets/functions/read-dev-secrets.function";
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
  if (!existsSync(manifest)) return {};
  const values = readDevSecrets(join(workspaceRoot(memberRoot), DEV_SECRETS_FILE));
  if (values === undefined) return {};
  const rows = (JSON.parse(readFileSync(manifest, "utf8")) as StackraManifest).env ?? [];
  return Object.fromEntries(
    rows
      .filter((row) => row.kind === "secret" && Object.hasOwn(values, row.name))
      .map((row) => [row.name, values[row.name] as string]),
  );
}
