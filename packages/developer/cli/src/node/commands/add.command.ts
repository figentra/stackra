/**
 * Stackra file contract:
 * Purpose: `AddCommand`, `stackra add <kind> <name>[@version] [--registry <origin>]`: resolves `@stackra/<kind>-<name>`,
 *          then `@stackra-pro/<kind>-<name>` (a package: `@stackra/<name>`, then `@stackra-pro/<name>`) in the registry
 *          catalogue, picks the version (`latest`, a dist-tag or an exact version), and installs it: a package through
 *          `pnpm add` (a task; its output shows under `--verbose`, its tail on failure), any other kind by
 *          `installItem` from its integrity-checked tarball, pinned in `stackra-items.lock.yaml`. The `--json` data is
 *          the item, version and target.
 * Boundary: the registry is reached only through `httpCatalogueClient` (tests mock it). The licence token comes from
 *           `STACKRA_LICENCE_TOKEN` and is never printed. Exit 1 for an unknown item, a wrong kind or version, or a
 *           failed install; 2 for a bad command line.
 * Runtime: node
 * Governing contract: ADR 0453 (decisions 10, 11 and 12); ADR 0282 (decision 3); ADR 0506; STA-1966.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { Argument, Command, CommandError, Option, type CommandIo } from "@stackra/console";
import { Enum } from "@stackra/contracts";
import {
  STACKRA_MANIFEST_SCHEMA,
  StackraKind,
  type CatalogueItem,
} from "@stackra/skills/contracts";
import { Str } from "@stackra/validation";

import { ITEM_SCOPES } from "#node/constants/item-scopes.constant";
import { httpCatalogueClient } from "#node/functions/http-catalogue-client.function";
import { installItem } from "#node/functions/install-item.function";
import { readItemsLock } from "#node/functions/read-items-lock.function";
import { readTarball } from "#node/functions/read-tarball.function";
import { registryOrigin } from "#node/functions/registry-origin.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import { writeItemsLock } from "#node/functions/write-items-lock.function";

// A contract package is a consumer's devDependency that gen reads, and a docs package the docs hub's (ADR 0514);
// neither is an item `stackra add` installs.
const KINDS: readonly string[] = Enum.values(StackraKind).filter(
  (kind) => kind !== StackraKind.Contract && kind !== StackraKind.Docs,
);

/** `<name>[@version]`. */
const ITEM = /^([a-z0-9][a-z0-9-]*)(?:@(.+))?$/;

/** Installs a registry item. */
export class AddCommand extends Command({
  name: "add",
  description: "Install a registry item: a skill, agent, MCP server, plugin or package",
  bin: true,
}) {
  /** The item's kind. */
  @Argument({
    description: "What to add",
    choices: KINDS,
  })
  kind!: string;

  /** The item's name and optional version or dist-tag. */
  @Argument({ description: "The item's name, then @<version> or @<dist-tag> (default: latest)" })
  @Str({ pattern: ITEM })
  item!: string;

  /** The registry origin. */
  @Option({ description: "The registry origin (default: the workspace's registry setting)" })
  @Str
  registry?: string;

  /** Resolves and installs the item; returns what it installed. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, string>>> {
    const kind = this.kind as StackraKind;
    const [, name = "", wanted] = ITEM.exec(this.item) ?? [];
    const root = workspaceRoot(io.cwd);
    const client = httpCatalogueClient({
      origin: registryOrigin(root, this.registry),
      token: process.env["STACKRA_LICENCE_TOKEN"] || undefined,
    });
    let item: CatalogueItem | null = null;
    for (const scope of ITEM_SCOPES) {
      item = await client.item(
        kind === StackraKind.Package ? `${scope}/${name}` : `${scope}/${kind}-${name}`,
      );
      if (item !== null) break;
    }
    if (item === null)
      throw new CommandError(`no ${kind} named ${name} in ${ITEM_SCOPES.join(" or ")}`);
    if (item.kind !== kind) throw new CommandError(`${item.name} is a ${item.kind}, not a ${kind}`);
    const version = wanted === undefined ? item.latest : (item.distTags[wanted] ?? wanted);
    if (item.versions !== undefined && !item.versions.includes(version))
      throw new CommandError(`${item.name} has no version ${version}`);
    if (item.deprecated !== null) io.output.warn(`${item.name} is deprecated: ${item.deprecated}`);

    if (kind === StackraKind.Package) {
      const atRoot = existsSync(join(io.cwd, "pnpm-workspace.yaml"));
      const spec = `${item.name}@${version}`;
      await io.output.task(`Installing ${spec}`, () =>
        io.process.run("pnpm", ["add", ...(atRoot ? ["-w"] : []), spec]),
      );
      io.output.success(`added ${spec}`);
      return { name: item.name, kind, version };
    }

    const { bytes, integrity } = await client.tarball(item.name, version);
    const files = readTarball(bytes);
    const packageJson = files.get("package.json");
    if (packageJson === undefined) throw new Error(`${item.name}@${version} has no package.json`);
    const { stackra } = JSON.parse(new TextDecoder().decode(packageJson)) as {
      stackra?: unknown;
    };
    const manifest = STACKRA_MANIFEST_SCHEMA.parse(stackra ?? {});
    if (manifest.kind !== kind) {
      throw new Error(
        `${item.name}@${version} declares stackra.kind ${manifest.kind}, not ${kind}`,
      );
    }

    const lock = readItemsLock(root);
    const target = installItem(
      root,
      { kind, name, files, manifest },
      lock.items[item.name] !== undefined,
    );
    writeItemsLock(root, {
      lockfileVersion: 1,
      items: { ...lock.items, [item.name]: { kind, version, integrity, target } },
    });
    io.output.success(`added ${item.name}@${version} to ${target}`);
    if (kind === StackraKind.Mcp) io.output.line("run `stackra mcp sync` to render .mcp.json");
    return { name: item.name, kind, version, target };
  }
}
