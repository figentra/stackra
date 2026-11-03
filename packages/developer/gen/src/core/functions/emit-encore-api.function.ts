/**
 * Stackra file contract:
 * Purpose: `emitEncoreApi`, a service's Encore endpoints (`.stackra/encore/<member>/api.ts`): one `api()` per own
 *          action or query whose manifest entry has an endpoint, with that entry's method and path, typed by its input
 *          and output schema classes, running the call as `new ActionPipeline(container).execute(<class>, input,
 *          { actor })` inside `app.handlers.run`. The endpoint is named by the camel-cased key and its version
 *          (`shop.order.cancel@1` is `shopOrderCancelV1`).
 * Boundary: pure; reads the manifest's actions and the member's classes and shapes. The actor comes only from
 *           Encore's verified auth data (`getAuthData()` of `~encore/auth`, `{ userID, actor }`), never from the body,
 *           a path parameter or a header. An entry is `auth: true` unless its actors list `ActorKind.Anonymous`
 *           (`anonymous` in the manifest, STA-2025): then it is `auth: false` and runs as a fresh anonymous actor when
 *           no session was presented. No adapter is written for an entry without an endpoint, a hosted package's
 *           entry (its manifest does not name the files of its schemas) or one whose input or output schema is not a
 *           shape of the member; a service with none gets no file. A path parameter is always an input field:
 *           `buildManifest` refuses one that is not (`endpoint_param_unbound`), since Encore binds it from the input. A refusal propagates as Encore's default error
 *           until the refusal mapping lands.
 * Runtime: isomorphic
 * Governing contract: ADR 0091 (decision 2) and 0124 (Encore is generated); ADR 0294 (decision 21: the derived
 *                     endpoint); ADR 0098 (the actor from the credential); ADR 0295 (decision 8: the adapters reach the
 *                     member through `handlers`); STA-2025 (the anonymous opt-in); STA-2063.
 */
import type { StackraManifest } from "@stackra/contracts";
import { camelCase } from "@stackra/support";

import { ENCORE_APP_IMPORT } from "#core/constants/encore-app-import.constant";
import { encoreDatabaseImport } from "#core/functions/encore-database-import.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import { importLines } from "#core/functions/import-lines.function";
import { ownClass } from "#core/functions/own-class.function";
import { shapeOfRef } from "#core/functions/shape-of-ref.function";
import type { ClassRef } from "#core/types/class-ref.type";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A manifest entry, read loosely: each section's entries are open records. */
type Entry = Readonly<Record<string, unknown>>;

/** The local names this file always binds, which a member class never takes. */
const RESERVED = ["ActionPipeline", "ActorKind", "api", "app", "getAuthData", "mintPublicId"];

/**
 * The Encore endpoints of a service, or undefined when it has no own action or query with an endpoint.
 *
 * @param ir - the member read by discovery.
 * @param manifest - the manifest built from `ir`, whose entries carry the derived endpoints.
 * @example
 * emitEncoreApi(ir, manifest)?.path; // ".stackra/encore/shop/api.ts"
 */
export function emitEncoreApi(ir: MemberIR, manifest: StackraManifest): GeneratedFile | undefined {
  if (ir.layout !== "service") return undefined;
  const imports = new Map<string, Map<string, boolean>>();
  const local = new Map<string, string>();
  const taken = new Set(RESERVED);
  const use = (from: string, name: string, typeOnly: boolean): void => {
    const names = imports.get(from) ?? new Map<string, boolean>();
    names.set(name, typeOnly && names.get(name) !== false);
    imports.set(from, names);
  };
  /** The local name a class is printed by, importing it once; a clash gets an alias. */
  const ref = (target: ClassRef, typeOnly: boolean): string => {
    const key = `${target.from}#${target.name}`;
    let name = local.get(key);
    if (name === undefined) {
      name = target.name;
      for (let index = 2; taken.has(name); index += 1) name = `${target.name}${index}`;
      taken.add(name);
      local.set(key, name);
    }
    use(target.from, name === target.name ? name : `${target.name} as ${name}`, typeOnly);
    return name;
  };
  /** The shape an entry's `input` or `output` names: undefined when absent, null when the member has no such shape. */
  const shapeOf = (value: unknown): ClassRef | undefined | null => {
    if (value === undefined) return undefined;
    const shape = shapeOfRef(ir, value);
    return shape === undefined ? null : { name: shape.name, from: shape.importPath };
  };

  const body: string[] = [];
  let anonymous = false;
  for (const entry of (manifest.actions ?? []) as readonly Entry[]) {
    const endpoint = entry["endpoint"] as { method?: unknown; path?: unknown } | false | undefined;
    if (typeof endpoint !== "object" || typeof entry["from"] === "string") continue;
    const declared = ownClass(ir, entry["class"], entry["module"]);
    const input = shapeOf(entry["input"]);
    const output = shapeOf(entry["output"]);
    if (declared === undefined || input === null || output === null) continue;

    const key = String(entry["key"]);
    const method = String(endpoint.method);
    const path = String(endpoint.path);
    const open = entry["anonymous"] === true;
    anonymous ||= open;
    const type = ref({ name: declared.name, from: declared.importPath }, false);
    const parameter = input === undefined ? "" : `input: ${ref(input, true)}`;
    const result = output === undefined ? "void" : ref(output, true);
    const actor = open
      ? 'getAuthData()?.actor ?? { kind: ActorKind.Anonymous, id: mintPublicId("anon") }'
      : "getAuthData()!.actor";
    body.push(
      `/** ${method} ${path}: ${key} through the action pipeline. */`,
      `export const ${camelCase(key.replace("@", "_v"))} = api(`,
      `  { method: ${JSON.stringify(method)}, path: ${JSON.stringify(path)}, expose: true, auth: ${!open} },`,
      `  (${parameter}): Promise<${result}> =>`,
      "    app.handlers.run((container) =>",
      `      new ActionPipeline(container).execute(${type}, ${input === undefined ? "{}" : "input"}, {`,
      `        actor: ${actor},`,
      "      }),",
      "    ),",
      ");",
      "",
    );
  }
  if (body.length === 0) return undefined;

  use("@stackra/actions", "ActionPipeline", false);
  if (anonymous) {
    use("@stackra/contracts", "ActorKind", false);
    use("@stackra/contracts", "mintPublicId", false);
  }
  use("encore.dev/api", "api", false);
  use("~encore/auth", "getAuthData", false);
  const header = generatedHeader({
    from: "stackra.manifest.json (the own actions and queries with an endpoint)",
    purpose: `the Encore endpoints of ${ir.package}: one api() per action and query, run through the action pipeline.`,
    boundary:
      "the actor comes only from the verified auth data (`getAuthData()`), an anonymous one only where the call " +
      "lists anonymous actors; every call runs through the server app's handlers, so a drain waits for it.",
    runtime: "node",
  });
  return {
    path: `.stackra/encore/${ir.member}/api.ts`,
    content: [
      header,
      ...encoreDatabaseImport(ir),
      ...importLines(imports),
      "",
      ENCORE_APP_IMPORT,
      "",
      ...body,
    ]
      .join("\n")
      .replace(/\n+$/, "\n"),
  };
}
