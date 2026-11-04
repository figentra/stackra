/**
 * Stackra file contract:
 * Purpose: `LsCommand`, `stackra ls [section]`: the derived identities a member's committed `stackra.manifest.json`
 *          locks (action keys, event wire names, permissions, refusal codes, models, drivers, modules) as a table, one
 *          row per identity; without a section, one row per section with its count. At the workspace root it reads
 *          every member's manifest and adds a package column. The rows are the `--json` data.
 * Boundary: reads committed manifests only; never runs gen, so it shows what is committed. Exits 1 when there is no
 *           manifest, 2 for an unknown section.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 20 and consequences: `stackra ls <kind>`; decision 10); ADR 0506; STA-1966.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { Argument, Command, CommandError, type CommandIo } from "@stackra/console";
import type { StackraManifest } from "@stackra/contracts";

import { MANIFEST_IDENTITIES } from "#node/constants/manifest-identities.constant";
import { workspaceMembers } from "#node/functions/workspace-members.function";

/** Lists the identities committed manifests lock. */
export class LsCommand extends Command({
  name: "ls",
  description: "List the identities a committed manifest locks (actions, events, permissions, …)",
  bin: true,
}) {
  /** One section, or every section's count. */
  @Argument({
    description: "One section to list; every section's count when absent",
    optional: true,
    choices: Object.keys(MANIFEST_IDENTITIES),
  })
  section?: string;

  /** Draws the table. */
  handle(io: CommandIo): void {
    const atRoot = existsSync(join(io.cwd, "pnpm-workspace.yaml"));
    const files = (atRoot ? workspaceMembers(io.cwd) : [io.cwd])
      .map((root) => join(root, "stackra.manifest.json"))
      .filter((file) => existsSync(file));
    if (files.length === 0)
      throw new CommandError("no stackra.manifest.json here", { fix: "stackra gen" });
    const rows: Record<string, unknown>[] = [];
    for (const file of files) {
      const manifest = JSON.parse(readFileSync(file, "utf8")) as StackraManifest;
      const owner = atRoot ? { package: manifest.package } : {};
      for (const [name, field] of Object.entries(MANIFEST_IDENTITIES)) {
        if (this.section !== undefined && name !== this.section) continue;
        const entries = Array.isArray(manifest[name])
          ? (manifest[name] as Record<string, unknown>[])
          : [];
        if (this.section === undefined)
          rows.push({ ...owner, section: name, count: entries.length });
        else for (const entry of entries) rows.push({ ...owner, identity: String(entry[field]) });
      }
    }
    io.output.table({
      columns: [
        ...(atRoot ? [{ header: "Package", key: "package" }] : []),
        ...(this.section === undefined
          ? [
              { header: "Section", key: "section" },
              { header: "Count", key: "count", kind: "count" as const },
            ]
          : [{ header: this.section, key: "identity" }]),
      ],
      rows,
    });
  }
}
