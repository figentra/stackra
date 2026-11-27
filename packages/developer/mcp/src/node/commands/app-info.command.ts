/**
 * Stackra file contract:
 * Purpose: `AppInfoCommand`, the `app_info` tool of the local MCP: the facts of the repository it serves, in one
 *          answer: the root package (name, version, package manager), the Node version, the environment the server
 *          runs in and whether it is deployed, the root runway (project, environments, provider names, Encore app),
 *          every member (key, package, folder, kind, version, area, and how many entries each manifest section holds),
 *          and the dev ports and URLs `stackra dev` wrote for the running lane.
 * Boundary: reads files only (`package.json`, `runway.yaml`, the manifests, `.stackra/dev/ports.json`); never runs
 *           anything. A provider's settings, ids and every secret reference stay out: only provider names. A runway
 *           that does not parse is reported as its error, so the other facts still answer.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); ADR 0296 (the root runway and dev facts); STA-2873.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { Command, type CommandIo } from "@stackra/console";
import { readRunway } from "@stackra/runway/node";

import { LOCAL_ENVIRONMENTS } from "#node/constants/local-environments.constant";
import { readMembers } from "#node/functions/read-members.function";
import type { DevToolHost } from "#core/ports/dev-tool-host.port";
import type { ManifestMember } from "#node/types/manifest-member.type";

/** The dev facts file `stackra dev` writes, from the root. */
const DEV_FACTS = ".stackra/dev/ports.json";

/** An object's own keys, or none. */
const keysOf = (value: unknown): string[] =>
  typeof value === "object" && value !== null ? Object.keys(value) : [];

/** The parsed JSON at `file`, or undefined when it is missing or not JSON. */
function readJson(file: string): Record<string, unknown> | undefined {
  if (!existsSync(file)) return undefined;
  try {
    const value: unknown = JSON.parse(readFileSync(file, "utf8"));
    return typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

/** The kind of a member, from its manifest and folder. */
function kindOf(member: ManifestMember): string {
  if (member.manifest?.kind === "app" || member.dir.startsWith("apps/")) return "app";
  if (member.dir.startsWith("services/")) return "service";
  if (member.dir.startsWith("workers/")) return "worker";
  return "package";
}

/** `url` and `port` of each entry of a dev facts record. */
function endpoints(record: unknown): Record<string, { url?: unknown; port?: unknown }> {
  return Object.fromEntries(
    keysOf(record).map((key) => {
      const entry = (record as Record<string, Record<string, unknown>>)[key] ?? {};
      return [key, { url: entry["url"], port: entry["port"] }];
    }),
  );
}

/** Reports the facts of the repository. */
export class AppInfoCommand extends Command({
  name: "app:info",
  description:
    "The facts of this repository: root package, Node version, environment, runway (project, environments, " +
    "providers, Encore app), every member with its kind and manifest counts, and the dev ports and URLs",
  bin: true,
  tool: { readOnly: true },
}) {
  /** The server's runner and environment; absent when the kernel builds the command to read its fields. */
  private readonly host: DevToolHost | undefined;

  constructor(host: DevToolHost) {
    super();
    this.host = host;
  }

  /** Reads the repository's facts. */
  handle(io: CommandIo): Record<string, unknown> {
    const root = io.cwd;
    const pkg = readJson(join(root, "package.json"));
    // Unset is not local (fail closed): the name is null and the server counts as deployed.
    const environment = this.host?.environment()["STACKRA_ENVIRONMENT"] || null;
    const facts = readJson(join(root, DEV_FACTS));
    return {
      root,
      package:
        pkg === undefined
          ? null
          : {
              name: pkg["name"] ?? null,
              version: pkg["version"] ?? null,
              packageManager: pkg["packageManager"] ?? null,
            },
      node: process.version,
      environment: {
        name: environment,
        deployed: environment === null || !LOCAL_ENVIRONMENTS.includes(environment),
      },
      runway: this.runway(root),
      members: readMembers(root).map((member) => ({
        member: member.manifest?.member ?? null,
        package: member.name ?? member.manifest?.package ?? null,
        path: member.dir,
        kind: kindOf(member),
        version: member.manifest?.version ?? null,
        ...(member.manifest?.area === undefined ? {} : { area: member.manifest.area }),
        sections:
          member.manifest === undefined
            ? null
            : Object.fromEntries(
                Object.entries(member.manifest).flatMap(([key, value]) =>
                  Array.isArray(value) ? [[key, value.length]] : [],
                ),
              ),
      })),
      dev:
        facts === undefined
          ? null
          : {
              environment: facts["environment"] ?? null,
              lane: facts["lane"] ?? null,
              members: endpoints(facts["members"]),
              infra: endpoints(facts["infra"]),
            },
    };
  }

  /** The root runway's project, environments, provider names and Encore app; its error when it does not parse. */
  private runway(root: string): Record<string, unknown> | null {
    const file = join(root, "runway.yaml");
    if (!existsSync(file)) return null;
    try {
      const runway = readRunway(file, "root") as unknown as Record<string, unknown>;
      const providers = (runway["providers"] ?? {}) as Record<string, unknown>;
      const encore = providers["encore"];
      return {
        project: runway["project"] ?? null,
        environments: keysOf(runway["environments"]),
        providers: keysOf(providers),
        encoreApp:
          typeof encore === "object" && encore !== null
            ? ((encore as { app?: unknown }).app ?? null)
            : null,
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
}
