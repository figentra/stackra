/**
 * Stackra file contract:
 * Purpose: `declaredDevSecrets(root)`, the `env` rows of every workspace member that runs (a service, an app, a
 *          worker), from its committed `stackra.manifest.json`; a service's rows already include its packages'.
 * Boundary: reads `pnpm-workspace.yaml`, each member's `stackra.config.ts` call and manifest; names only. A member
 *           with no manifest (gen has not run) adds nothing.
 * Runtime: node
 * Governing contract: ADR 0525 (amendment of 2026-11-10); ADR 0294 (decision 10: the committed manifest); STA-2679.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { StackraManifest } from "@stackra/contracts";

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
    const manifest = join(member, "stackra.manifest.json");
    if (!existsSync(manifest)) return [];
    const { layout } = readMember(member);
    if (layout !== "service" && layout !== "app" && layout !== "worker") return [];
    return (JSON.parse(readFileSync(manifest, "utf8")) as StackraManifest).env ?? [];
  });
}
