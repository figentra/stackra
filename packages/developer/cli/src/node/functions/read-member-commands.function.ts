/**
 * Stackra file contract:
 * Purpose: `readMemberCommands(cwd, reserved)`, the console commands the members around `cwd` declare, one row per
 *          name with every member that declares it: read from each member's committed `stackra.manifest.json`
 *          (`commands`) at the workspace root around `cwd`, or from `cwd` alone outside a workspace. Only an app, a
 *          service or a worker hosts a console (gen writes no console entry for a package, whose commands run in its
 *          host), so a package member is never offered. A name or alias in `reserved` (the `stackra` commands) is
 *          left out, so the CLI's own command always wins; a package's own binary command (`bin`) is left out, since it
 *          never runs in a host's console.
 * Boundary: reads pnpm-workspace.yaml, the manifests and each declaring member's `stackra.config.ts` text (through
 *           `readMember`); never runs a member or gen. A missing, unreadable or malformed manifest, row or workspace
 *           file gives no command rather than an error, because every `stackra` run that names no CLI command reads
 *           these.
 * Runtime: node
 * Governing contract: ADR 0506 (decision 6); ADR 0294 (decision 10: the committed manifest); STA-2888.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";

import type { StackraManifest } from "@stackra/contracts";

import { readMember } from "#node/functions/read-member.function";
import { workspaceMembers } from "#node/functions/workspace-members.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import type { MemberCommand } from "#node/types/member-command.type";
import type { MemberCommandHost } from "#node/types/member-command-host.type";

/** One `commands` row of a manifest. */
type ManifestCommandRow = NonNullable<StackraManifest["commands"]>[number];

/** The member roots around `cwd` with their labels. */
function membersAround(cwd: string): readonly { readonly root: string; readonly label: string }[] {
  const root = workspaceRoot(cwd);
  if (!existsSync(join(root, "pnpm-workspace.yaml"))) return [{ root: cwd, label: basename(cwd) }];
  try {
    return workspaceMembers(root).map((member) => ({
      root: member,
      label: relative(root, member) || basename(member),
    }));
  } catch {
    return [];
  }
}

/** The layouts gen writes a console entry for (ADR 0506 decision 6). */
const CONSOLE_LAYOUTS: ReadonlySet<string> = new Set(["app", "service", "worker"]);

/** Whether the member at `root` runs a console of its own. */
function hostsConsole(root: string): boolean {
  try {
    return CONSOLE_LAYOUTS.has(readMember(root).layout);
  } catch {
    return false;
  }
}

/** The well-formed command rows of the manifest at `root`, or none. */
function commandRows(root: string): readonly ManifestCommandRow[] {
  const path = join(root, "stackra.manifest.json");
  if (!existsSync(path)) return [];
  try {
    const commands = (JSON.parse(readFileSync(path, "utf8")) as { commands?: unknown }).commands;
    if (!Array.isArray(commands)) return [];
    return commands.filter(
      (row): row is ManifestCommandRow =>
        typeof row === "object" &&
        row !== null &&
        typeof (row as { name?: unknown }).name === "string" &&
        (row as { bin?: unknown }).bin !== true,
    );
  } catch {
    return [];
  }
}

/**
 * The member commands around `cwd`, sorted by name.
 *
 * @param cwd - the working directory; the workspace root around it is read.
 * @param reserved - the names and aliases `stackra` itself answers to, which a member command never takes.
 * @example
 * readMemberCommands("/repo", new Set(["gen", "check"]));
 * // [{ name: "db:status", aliases: [], hidden: false, hosts: [{ root: "/repo/services/orders", label: "services/orders", from: "@stackra/database" }] }]
 */
export function readMemberCommands(
  cwd: string,
  reserved: ReadonlySet<string>,
): readonly MemberCommand[] {
  const byName = new Map<
    string,
    { hosts: MemberCommandHost[]; aliases: Set<string>; hidden: boolean }
  >();
  for (const { root, label } of membersAround(cwd)) {
    const rows = commandRows(root);
    if (rows.length === 0 || !hostsConsole(root)) continue;
    for (const row of rows) {
      if (reserved.has(row.name)) continue;
      const entry = byName.get(row.name) ?? { hosts: [], aliases: new Set<string>(), hidden: true };
      if (entry.hosts.some((host) => host.root === root)) continue;
      entry.hosts.push({
        root,
        label,
        ...(typeof row.from === "string" ? { from: row.from } : {}),
      });
      if (Array.isArray(row.aliases))
        for (const alias of row.aliases) if (typeof alias === "string") entry.aliases.add(alias);
      entry.hidden &&= row.hidden === true;
      byName.set(row.name, entry);
    }
  }
  // An alias stays only while it names nothing else: no stackra command, no member command, no other alias.
  const taken = new Set([...reserved, ...byName.keys()]);
  const claims = new Map<string, number>();
  for (const { aliases } of byName.values())
    for (const alias of aliases) claims.set(alias, (claims.get(alias) ?? 0) + 1);
  return [...byName]
    .map(([name, entry]) => ({
      name,
      aliases: [...entry.aliases]
        .filter((alias) => !taken.has(alias) && claims.get(alias) === 1)
        .toSorted(),
      hidden: entry.hidden,
      hosts: entry.hosts.toSorted((a, b) => a.label.localeCompare(b.label)),
    }))
    .toSorted((a, b) => a.name.localeCompare(b.name));
}
