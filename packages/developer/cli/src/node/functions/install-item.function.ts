/**
 * Stackra file contract:
 * Purpose: `installItem(root, item, replace)`, writes an item where ADR 0453 decision 11 puts its kind: a skill into
 *          `.agents/skills/<name>/`, an agent's `agent.md` as `.agents/agents/<name>.md`, an MCP server's entry under
 *          `mcpServers.<name>` in `.mcp.yaml` (comments kept), a plugin into `.agents/plugins/<name>/`. Returns the
 *          target, relative to `root`, for the lock.
 * Boundary: writes only that target. Refuses to replace a target that exists unless `replace` (the lock already
 *           pins this item), so a hand-written skill, agent or server of the same name is never overwritten.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 11); ADR 0282 (decision 10: `.mcp.yaml` is the MCP source).
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { StackraKind } from "@stackra/skills/contracts";
import { Document, parseDocument } from "yaml";

import { ITEM_REQUIRED_FILES } from "#node/constants/item-required-files.constant";
import type { ItemInstall } from "#node/types/item-install.type";

/** The refusal for a target the lock does not pin. */
const refuse = (target: string) =>
  new Error(`${target} exists and is not in the items lock; move it away first`);

/**
 * Installs `item` into the workspace at `root`.
 *
 * @param root - the workspace root.
 * @param item - the item and its tarball's files.
 * @param replace - true when the lock already pins this item, so its target may be replaced.
 * @example
 * installItem("/repo", { kind: "skill", name: "archify", files, manifest: { kind: "skill" } }, false);
 * // ".agents/skills/archify"
 */
export function installItem(root: string, item: ItemInstall, replace: boolean): string {
  const { kind, name, files, manifest } = item;
  const required = ITEM_REQUIRED_FILES[kind];
  if (required !== undefined && !files.has(required)) {
    throw new Error(`the ${kind} ${name} has no ${required} at its root`);
  }

  if (kind === StackraKind.Mcp) {
    if (manifest.kind !== StackraKind.Mcp)
      throw new Error(`the mcp item ${name} has no stackra.mcp entry`);
    const file = join(root, ".mcp.yaml");
    const document = existsSync(file)
      ? parseDocument(readFileSync(file, "utf8"))
      : new Document({ mcpServers: {} });
    if (document.hasIn(["mcpServers", name]) && !replace)
      throw refuse(`.mcp.yaml mcpServers.${name}`);
    document.setIn(["mcpServers", name], manifest.mcp);
    writeFileSync(file, document.toString());
    return `.mcp.yaml#mcpServers.${name}`;
  }

  if (kind === StackraKind.Agent) {
    const target = `.agents/agents/${name}.md`;
    const file = join(root, target);
    if (existsSync(file) && !replace) throw refuse(target);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, files.get("agent.md") as Uint8Array);
    return target;
  }

  const target = `.agents/${kind === StackraKind.Skill ? "skills" : "plugins"}/${name}`;
  const folder = join(root, target);
  if (existsSync(folder)) {
    if (!replace) throw refuse(target);
    rmSync(folder, { recursive: true, force: true });
  }
  for (const [path, bytes] of files) {
    mkdirSync(dirname(join(folder, path)), { recursive: true });
    writeFileSync(join(folder, path), bytes);
  }
  return target;
}
