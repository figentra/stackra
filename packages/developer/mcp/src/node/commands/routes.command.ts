/**
 * Stackra file contract:
 * Purpose: `RoutesCommand`, the `routes` tool of the local MCP: every HTTP endpoint the committed manifests declare
 *          (method, path, the action or query behind it, its permission, risk and API area, and the package it comes
 *          from when hosted), sorted by path then method, and every app page (`routes` of an app manifest). Narrowed
 *          to one member, and to the entries whose path, key or page holds `search`.
 * Boundary: reads committed manifests only; never runs gen or the app, so it shows what is committed. Fails with the
 *           fix `stackra gen` when there is no manifest.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: inspect routes); ADR 0294 (rule R10); ADR 0082 (API areas); STA-2873.
 */
import { Command, CommandError, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { readMembers } from "#node/functions/read-members.function";
import { resolveMember } from "#node/functions/resolve-member.function";

/** An entry of a manifest section. */
type Entry = Readonly<Record<string, unknown>>;

/** A field when it is present. */
const field = (entry: Entry, name: string): Record<string, unknown> =>
  entry[name] === undefined ? {} : { [name]: entry[name] };

/** Lists the endpoints and pages. */
export class RoutesCommand extends Command({
  name: "routes",
  description:
    "List the HTTP endpoints (method, path, action, permission, risk, area) and the app pages the committed " +
    "manifests declare",
  bin: true,
  tool: { readOnly: true },
}) {
  /** The member to read; every member when absent. */
  @Option({
    description: "A member: its key (`commerce`), package name or folder; every member when absent",
  })
  @Str
  member?: string;

  /** The text an entry must hold. */
  @Option({
    description: "Only entries whose path, action key or page key holds this text (any case)",
  })
  @Str
  search?: string;

  /** The endpoints and pages. */
  handle(io: CommandIo): Record<string, unknown> {
    const members =
      this.member === undefined ? readMembers(io.cwd) : [resolveMember(io.cwd, this.member)];
    const manifests = members.flatMap((member) =>
      member.manifest === undefined ? [] : [member.manifest],
    );
    if (manifests.length === 0)
      throw new CommandError("No stackra.manifest.json to read routes from", {
        fix: "stackra gen",
      });
    const needle = this.search?.toLowerCase();
    const holds = (...texts: unknown[]): boolean =>
      needle === undefined ||
      texts.some((text) => typeof text === "string" && text.toLowerCase().includes(needle));

    const endpoints = manifests
      .flatMap((manifest) =>
        ((manifest.actions ?? []) as readonly Entry[]).flatMap((action) => {
          const endpoint = action["endpoint"] as Entry | undefined;
          const method = endpoint?.["method"];
          const path = endpoint?.["path"];
          if (typeof method !== "string" || typeof path !== "string" || !holds(path, action["key"]))
            return [];
          return [
            {
              member: manifest.member,
              method,
              path,
              action: action["key"],
              kind: action["kind"],
              ...field(action, "permission"),
              ...field(action, "risk"),
              ...field(action, "area"),
              ...field(action, "from"),
            },
          ];
        }),
      )
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

    const pages = manifests.flatMap((manifest) =>
      (((manifest as Record<string, unknown>)["routes"] ?? []) as readonly Entry[]).flatMap(
        (route) =>
          holds(route["key"], route["path"])
            ? [
                {
                  member: manifest.member,
                  key: route["key"],
                  ...field(route, "path"),
                  ...field(route, "file"),
                },
              ]
            : [],
      ),
    );
    return { endpoints, pages };
  }
}
