/**
 * Stackra file contract:
 * Purpose: `emitEncoreApi`, a service's Encore endpoints (`stackra-encore/<member>/api.ts`): one `api.raw()` per own
 *          action or query whose manifest entry has an endpoint (that entry's method and path) and one per own
 *          controller (any method, its `path`, a trailing `/*` as Encore's `/*rest`), each `expose: true` and
 *          `auth: false` to Encore, each calling `answerCall` of `./http`. That helper reads the body once under the
 *          cap, runs the request guards over its exact bytes, authenticates, then runs the call as `new
 *          ActionPipeline(container).execute(<class>, input, { actor, ...requestCallOptions(request), ...call })` (an
 *          action or query; `call` is an API key's credential, origin and sandbox) or `container.get(<class>)
 *          .handle(request)` (a controller). The endpoint is named by the camel-cased key and its version (`shop.order
 *          .cancel@1` is `shopOrderCancelV1`), a controller by its class name. A hosted package's actions, queries and
 *          controllers get the same adapters, imported from the entry its manifest's `services` names, when the host
 *          imports its root module (the manifest names the module's file), as the wiring binds them. An action or
 *          query endpoint names its class to the helper as `action`, so `serveGuardedCall` knows whether a forwarded user token may travel a
 *          second hop through it (ADR 0209, amendment of 2026-11-07).
 * Boundary: pure; prints the rows `encoreEndpoints` reads from the manifest's actions and the member's classes. The actor comes only from the verified
 *           `Authorization` header (`CallAuthenticator`, inside the helper), never from the body, a path parameter or
 *           another header. An entry may run without one only when its actors list `ActorKind.Anonymous`
 *           (`anonymous` in the manifest, STA-2025); a controller is reachable without a session, since it is raw (its
 *           own login or callback logic), and still goes through every guard. No adapter is written for an entry
 *           without an endpoint, or a hosted entry whose package has no authored root module or lists no class for it;
 *           a service with none gets no file. A hosted entry's query string is not coerced. Input is parsed by the
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

import { ENCORE_APP_IMPORT } from "#core/constants/encore-app-import.constant";
import { encoreDatabaseImport } from "#core/functions/encore-database-import.function";
import { encoreEndpoints } from "#core/functions/encore-endpoints.function";
import { encoreServiceFolder } from "#core/functions/encore-service-folder.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import { importLines } from "#core/functions/import-lines.function";
import type { ClassRef } from "#core/types/class-ref.type";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The local names this file always binds, which a member class never takes. */
const RESERVED = ["ActionPipeline", "answerCall", "api", "app", "requestCallOptions"];

/**
 * The Encore endpoints of a service, or undefined when it has no own action or query with an endpoint.
 *
 * @param ir - the member read by discovery.
 * @param manifest - the manifest built from `ir`, whose entries carry the derived endpoints.
 * @example
 * emitEncoreApi(ir, manifest)?.path; // "stackra-encore/shop/api.ts"
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
  for (const endpoint of encoreEndpoints(ir, manifest)) {
    const type = ref(endpoint.class, false);
    if (endpoint.kind === "controller") {
      body.push(
        `/** ${endpoint.path}: ${endpoint.class.name}, a raw controller, behind the same guards. */`,
        `export const ${endpoint.name} = api.raw(`,
        `  { method: "*", path: ${JSON.stringify(endpoint.route)}, expose: true, auth: false },`,
        "  (req, resp) =>",
        "    answerCall(req, resp, {",
        `      path: ${JSON.stringify(endpoint.route)},`,
        "      anonymous: true,",
        "      raw: true,",
        `      execute: (container, _input, _actor, request) => container.get(${type}).handle(request),`,
        "    }),",
        ");",
        "",
      );
      continue;
    }
    const { method, path } = endpoint;
    const input =
      endpoint.input === undefined ? [] : [`      input: ${ref(endpoint.input, false)},`];
    body.push(
      `/** ${method} ${path}: ${endpoint.key} through the action pipeline. */`,
      `export const ${endpoint.name} = api.raw(`,
      `  { method: ${JSON.stringify(method)}, path: ${JSON.stringify(path)}, expose: true, auth: false },`,
      "  (req, resp) =>",
      "    answerCall(req, resp, {",
      `      path: ${JSON.stringify(path)},`,
      `      anonymous: ${endpoint.anonymous},`,
      `      action: ${type},`,
      ...input,
      "      execute: (container, input, actor, request, call) =>",
      `        new ActionPipeline(container).execute(${type}, input as never, { actor, ...requestCallOptions(request), ...call }),`,
      "    }),",
      ");",
      "",
    );
  }
  if (body.length === 0) return undefined;

  if (body.some((line) => line.includes("new ActionPipeline("))) {
    use("@stackra/actions", "ActionPipeline", false);
    use("@stackra/actions", "requestCallOptions", false);
  }
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
    path: `${encoreServiceFolder(ir.member)}/api.ts`,
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
