/**
 * Stackra file contract:
 * Purpose: `LS_COMMAND`, `stackra ls [section]`: the derived identities a member's committed `stackra.manifest.json`
 *          locks (action keys, event wire names, permissions, refusal codes, models, drivers, modules), one per line;
 *          without a section, each section with its count. At the workspace root it reads every member's manifest
 *          and prefixes each line with the package name.
 * Boundary: reads committed manifests only; never runs gen, so it shows what is committed.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 20 and consequences: `stackra ls <kind>`); ADR 0294 (decision 10).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { StackraManifest } from "@stackra/contracts";

import { MANIFEST_IDENTITIES } from "#node/constants/manifest-identities.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { workspaceMembers } from "#node/functions/workspace-members.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra ls` command definition. */
export const LS_COMMAND: CliCommand = {
  name: "ls",
  summary: "List the identities a committed manifest locks (actions, events, permissions, …)",
  usage: `stackra ls [${Object.keys(MANIFEST_IDENTITIES).join("|")}]`,
  positionals: true,
  async run({ cwd, positionals, io }) {
    const [section, ...extra] = positionals;
    if (extra.length > 0) throw new CliUsageError(`unexpected argument: ${extra[0]}`);
    if (section !== undefined && MANIFEST_IDENTITIES[section] === undefined) {
      throw new CliUsageError(`unknown section: ${section}`);
    }
    const atRoot = existsSync(join(cwd, "pnpm-workspace.yaml"));
    const files = (atRoot ? workspaceMembers(cwd) : [cwd])
      .map((root) => join(root, "stackra.manifest.json"))
      .filter((file) => existsSync(file));
    if (files.length === 0) {
      io.err("no stackra.manifest.json here; run `stackra gen` first\n");
      return 1;
    }
    for (const file of files) {
      const manifest = JSON.parse(readFileSync(file, "utf8")) as StackraManifest;
      const prefix = atRoot ? `${manifest.package}  ` : "";
      for (const [name, field] of Object.entries(MANIFEST_IDENTITIES)) {
        if (section !== undefined && name !== section) continue;
        const entries = Array.isArray(manifest[name])
          ? (manifest[name] as Record<string, unknown>[])
          : [];
        if (section === undefined) {
          io.out(`${prefix}${name}  ${entries.length}\n`);
          continue;
        }
        for (const entry of entries) io.out(`${prefix}${String(entry[field])}\n`);
      }
    }
    return 0;
  },
};
