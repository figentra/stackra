/**
 * Stackra file contract:
 * Purpose: `declaredDevSecrets(root)`, the `env` rows of every workspace member that runs (a service, an app, a
 *          worker), from its committed `stackra.manifest.json` (a service's rows already include its packages'), plus
 *          one required `secret` row for each name its `runway.yaml` lists under `environments.dev.secrets`, so a
 *          product can ask for a dev value its configuration only marks optional.
 * Boundary: reads `pnpm-workspace.yaml`, each member's `stackra.config.ts` call, manifest and runway; names only. A
 *           member with neither a manifest nor a runway dev list adds nothing.
 * Runtime: node
 * Governing contract: ADR 0525 (amendment of 2026-11-10); ADR 0294 (decision 10: the committed manifest); STA-2679.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { StackraManifest } from "@stackra/contracts";

import { runwayDevSecretNames } from "#node/dev-secrets/functions/runway-dev-secret-names.function";
import type { DevSecretRow } from "#node/dev-secrets/types/dev-secret-row.type";
import { readMember } from "#node/functions/read-member.function";
import { workspaceMembers } from "#node/functions/workspace-members.function";

/**
 * The declared rows of the running members of the workspace at `root`.
 *
 * @param root - the folder holding `pnpm-workspace.yaml`.
 * @example
 * declaredDevSecrets("/repo").filter((row) => row.kind === "secret").map((row) => row.name);
 */
export function declaredDevSecrets(root: string): readonly DevSecretRow[] {
  return workspaceMembers(root).flatMap((member) => {
    const { layout } = readMember(member);
    if (layout !== "service" && layout !== "app" && layout !== "worker") return [];
    const manifest = join(member, "stackra.manifest.json");
    const rows = existsSync(manifest)
      ? ((JSON.parse(readFileSync(manifest, "utf8")) as StackraManifest).env ?? [])
      : [];
    const asked = runwayDevSecretNames(member).map((name): DevSecretRow => ({
      name,
      kind: "secret",
      required: true,
      environments: ["dev"],
      config: "runway",
      class: "runway.yaml",
      field: "environments.dev.secrets",
    }));
    return [...rows, ...asked];
  });
}
