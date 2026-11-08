/**
 * Stackra file contract:
 * Purpose: `emitEncoreApi`, a service's Encore endpoints (`.stackra/encore/<member>/api.ts`): one `api.raw()` per own
 *          action or query whose manifest entry has an endpoint (that entry's method and path) and one per own
 *          controller (any method, its `path`, a trailing `/*` as Encore's `/*rest`), each `expose: true` and
 *          `auth: false` to Encore, each calling `answerCall` of `./http`. That helper reads the body once under the
 *          cap, runs the request guards over its exact bytes, authenticates, then runs the call as `new
 *          ActionPipeline(container).execute(<class>, input, { actor })` (an action or query) or `container.get(<class>)
 *          .handle(request)` (a controller). The endpoint is named by the camel-cased key and its version (`shop.order
 *          .cancel@1` is `shopOrderCancelV1`), a controller by its class name. An action or query endpoint names its
 *          class to the helper as `action`, so `serveGuardedCall` knows whether a forwarded user token may travel a
 *          second hop through it (ADR 0209, amendment of 2026-11-07).
 * Boundary: pure; reads the manifest's actions and the member's classes. The actor comes only from the verified
 *           `Authorization` header (`CallAuthenticator`, inside the helper), never from the body, a path parameter or
 *           another header. An entry may run without one only when its actors list `ActorKind.Anonymous`
 *           (`anonymous` in the manifest, STA-2025); a controller is reachable without a session, since it is raw (its
 *           own login or callback logic), and still goes through every guard. No adapter is written for an entry
 *           without an endpoint or a hosted package's entry; a service with none gets no file. Input is parsed by the
 *           helper (JSON body, or the query string for GET and DELETE, then the path parameters) and validated by the
 *           pipeline; a path parameter is always an input field (`buildManifest` refuses one that is not,
 *           `endpoint_param_unbound`).
 * Runtime: isomorphic
 * Governing contract: ADR 0091 (decision 2) and 0124 (Encore is generated); ADR 0237 (STA-2577 note: every generated
 *                     adapter is raw, so the edge signature covers the body); ADR 0294 (decision 21: the derived
 *                     endpoint); ADR 0098 (the actor from the credential); ADR 0295 (decision 8: the adapters reach the
 *                     member through `handlers`); STA-2025 (the anonymous opt-in); STA-2063; STA-2577.
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
const RESERVED = ["ActionPipeline", "answerCall", "api", "app"];

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
  const body: string[] = [];
  for (const entry of (manifest.actions ?? []) as readonly Entry[]) {
    const endpoint = entry["endpoint"] as { method?: unknown; path?: unknown } | false | undefined;
    if (typeof endpoint !== "object" || typeof entry["from"] === "string") continue;
    const declared = ownClass(ir, entry["class"], entry["module"]);
    if (declared === undefined) continue;

    const key = String(entry["key"]);
    const method = String(endpoint.method);
    const path = String(endpoint.path);
    const type = ref({ name: declared.name, from: declared.importPath }, false);
    // The input schema class types a GET or DELETE's query string; one the member does not declare coerces nothing.
    const shape = entry["input"] === undefined ? undefined : shapeOfRef(ir, entry["input"]);
    const input =
      shape === undefined
        ? []
        : [`      input: ${ref({ name: shape.name, from: shape.importPath }, false)},`];
    body.push(
      `/** ${method} ${path}: ${key} through the action pipeline. */`,
      `export const ${camelCase(key.replace("@", "_v"))} = api.raw(`,
      `  { method: ${JSON.stringify(method)}, path: ${JSON.stringify(path)}, expose: true, auth: false },`,
      "  (req, resp) =>",
      "    answerCall(req, resp, {",
      `      path: ${JSON.stringify(path)},`,
      `      anonymous: ${entry["anonymous"] === true},`,
      `      action: ${type},`,
      ...input,
      "      execute: (container, input, actor) =>",
      `        new ActionPipeline(container).execute(${type}, input as never, { actor }),`,
      "    }),",
      ");",
      "",
    );
  }
  for (const controller of ir.classes) {
    const path = controller.options["path"];
    if (
      controller.kind !== "controller" ||
      controller.abstract === true ||
      typeof path !== "string"
    )
      continue;
    const type = ref({ name: controller.name, from: controller.importPath }, false);
    // Encore names a wildcard segment: `/api/auth/*` is `/api/auth/*rest`.
    const route = path.endsWith("/*") ? `${path}rest` : path;
    body.push(
      `/** ${path}: ${controller.name}, a raw controller, behind the same guards. */`,
      `export const ${camelCase(controller.name)} = api.raw(`,
      `  { method: "*", path: ${JSON.stringify(route)}, expose: true, auth: false },`,
      "  (req, resp) =>",
      "    answerCall(req, resp, {",
      `      path: ${JSON.stringify(route)},`,
      "      anonymous: true,",
      "      raw: true,",
      `      execute: (container, _input, _actor, request) => container.get(${type}).handle(request),`,
      "    }),",
      ");",
      "",
    );
  }
  if (body.length === 0) return undefined;

  if (body.some((line) => line.includes("new ActionPipeline(")))
    use("@stackra/actions", "ActionPipeline", false);
  use("encore.dev/api", "api", false);
  const header = generatedHeader({
    from: "stackra.manifest.json (the own actions and queries with an endpoint)",
    purpose: `the Encore endpoints of ${ir.package}: one api.raw() per action, query and controller, all answered by answerCall.`,
    boundary:
      "every endpoint is raw and auth: false to Encore; the guards, the authentication (CallAuthenticator) and the " +
      "anonymous actor, only where the call lists it, are decided in answerCall, never here.",
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
      'import { answerCall } from "./http";',
      "",
      ...body,
    ]
      .join("\n")
      .replace(/\n+$/, "\n"),
  };
}
