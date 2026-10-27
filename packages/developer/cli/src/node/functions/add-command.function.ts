/**
 * Stackra file contract:
 * Purpose: `addCommand(createClient)`, `stackra add <kind> <name>[@version]`: resolves `@stackra/<kind>-<name>`, then
 *          `@stackra-pro/<kind>-<name>` (a package: `@stackra/<name>`, then `@stackra-pro/<name>`) in the registry
 *          catalogue, picks the version (`latest`, a dist-tag or an exact version), and installs it: a package
 *          through `pnpm add`, any other kind by `installItem` from its integrity-checked tarball, pinned in
 *          `stackra-items.lock.yaml`.
 * Boundary: parses, resolves and prints; the registry is reached only through the `CatalogueClient` it is given
 *           (tests pass a fake). The licence token comes from `STACKRA_LICENCE_TOKEN` and is never printed.
 * Runtime: node
 * Governing contract: ADR 0453 (decisions 10, 11 and 12); ADR 0282 (decision 3).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { Enum } from "@stackra/contracts";
import {
  STACKRA_MANIFEST_SCHEMA,
  StackraKind,
  type CatalogueItem,
} from "@stackra/skills/contracts";

import { ITEM_SCOPES } from "#node/constants/item-scopes.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { installItem } from "#node/functions/install-item.function";
import { readItemsLock } from "#node/functions/read-items-lock.function";
import { readTarball } from "#node/functions/read-tarball.function";
import { registryOrigin } from "#node/functions/registry-origin.function";
import { runProcess } from "#node/functions/run-process.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import { writeItemsLock } from "#node/functions/write-items-lock.function";
import type { CatalogueClient } from "#node/types/catalogue-client.type";
import type { CliCommand } from "#node/types/cli-command.type";
import type { RegistryAccess } from "#node/types/registry-access.type";

const KINDS: readonly string[] = Enum.values(StackraKind);

/**
 * The `stackra add` command over the client `createClient` builds.
 *
 * @param createClient - builds the registry client from the origin and licence token.
 * @example
 * const ADD = addCommand(httpCatalogueClient);
 */
export function addCommand(createClient: (access: RegistryAccess) => CatalogueClient): CliCommand {
  return {
    name: "add",
    summary: "Install a registry item: a skill, agent, MCP server, plugin or package",
    usage: `stackra add <${KINDS.join("|")}> <name>[@version] [--registry <origin>]`,
    options: { registry: { type: "string" } },
    positionals: true,
    async run({ cwd, values, positionals, io }) {
      const [given, spec, ...extra] = positionals;
      if (extra.length > 0) throw new CliUsageError(`unexpected argument: ${extra[0]}`);
      if (given === undefined || !KINDS.includes(given)) {
        throw new CliUsageError(`unknown kind: ${given ?? "(none)"}`);
      }
      const kind = given as StackraKind;
      const match = /^([a-z0-9][a-z0-9-]*)(?:@(.+))?$/.exec(spec ?? "");
      if (match === null) throw new CliUsageError(`not an item name: ${spec ?? "(none)"}`);
      const [, name = "", wanted] = match;

      const root = workspaceRoot(cwd);
      const flag = typeof values["registry"] === "string" ? values["registry"] : undefined;
      const client = createClient({
        origin: registryOrigin(root, flag),
        token: process.env["STACKRA_LICENCE_TOKEN"] || undefined,
      });
      let item: CatalogueItem | null = null;
      for (const scope of ITEM_SCOPES) {
        item = await client.item(
          kind === StackraKind.Package ? `${scope}/${name}` : `${scope}/${kind}-${name}`,
        );
        if (item !== null) break;
      }
      if (item === null) {
        io.err(`stackra add: no ${kind} named ${name} in ${ITEM_SCOPES.join(" or ")}\n`);
        return 1;
      }
      if (item.kind !== kind) {
        io.err(`stackra add: ${item.name} is a ${item.kind}, not a ${kind}\n`);
        return 1;
      }
      const version = wanted === undefined ? item.latest : (item.distTags[wanted] ?? wanted);
      if (item.versions !== undefined && !item.versions.includes(version)) {
        io.err(`stackra add: ${item.name} has no version ${version}\n`);
        return 1;
      }
      if (item.deprecated !== null)
        io.err(`warning: ${item.name} is deprecated: ${item.deprecated}\n`);

      if (kind === StackraKind.Package) {
        const atRoot = existsSync(join(cwd, "pnpm-workspace.yaml"));
        return runProcess(
          {
            command: "pnpm",
            args: ["add", ...(atRoot ? ["-w"] : []), `${item.name}@${version}`],
            cwd,
          },
          io,
        );
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
      io.out(`added ${item.name}@${version} to ${target}\n`);
      if (kind === StackraKind.Mcp) io.out("run `stackra mcp sync` to render .mcp.json\n");
      return 0;
    },
  };
}
