/**
 * Stackra file contract:
 * Purpose: `encoreEndpoints`, the endpoints of a service's generated Encore app, in the order `api.ts` declares them:
 *          one per own action or query whose manifest entry has an endpoint, then one per own controller with a path,
 *          then a hosted package's actions, queries and controllers when the host imports its package's root module
 *          (the manifest names the module's file) and the package lists the class in `services`.
 * Boundary: pure; reads the manifest's actions and the member's classes and dependencies. An entry whose class neither
 *           the member nor a hosted package declares has no endpoint. A layout other than a service has none.
 * Runtime: isomorphic
 * Governing contract: ADR 0091 (decision 2) and 0124 (Encore is generated); ADR 0294 (decision 21: the derived
 *                     endpoint); ADR 0295 (decision 8); ADR 0182 (decision 3: the wiring suite reads the same rows);
 *                     STA-2025; STA-2063; STA-2838.
 */
import type { StackraManifest } from "@stackra/contracts";
import { camelCase } from "@stackra/support";

import { ownClass } from "#core/functions/own-class.function";
import { shapeOfRef } from "#core/functions/shape-of-ref.function";
import type { ClassRef } from "#core/types/class-ref.type";
import type { EncoreEndpoint } from "#core/types/encore-endpoint.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A manifest entry, read loosely: each section's entries are open records. */
type Entry = Readonly<Record<string, unknown>>;

/**
 * The endpoints of `ir`'s generated Encore app.
 *
 * @param ir - the member read by discovery.
 * @param manifest - the manifest built from `ir`, whose entries carry the derived endpoints.
 * @example
 * encoreEndpoints(ir, manifest)[0]; // { kind: "call", name: "shopOrderCancelV1", method: "POST", path: "/orders/:id/cancel", ... }
 */
export function encoreEndpoints(
  ir: MemberIR,
  manifest: StackraManifest,
): readonly EncoreEndpoint[] {
  if (ir.layout !== "service") return [];
  // A hosted package's module surface, as the wiring binds it: the classes its manifest lists in `services` (with the
  // entry each is exported from), for a dependency whose root module the host imports (its manifest names the file).
  const hosted = new Map<string, Entry[]>();
  for (const { package: name, manifest: dependency } of ir.dependencies) {
    const root = dependency.modules?.find((candidate) => candidate.key === dependency.member);
    const listed = dependency["services"];
    if (typeof root?.["file"] !== "string" || dependency.kind === "app" || !Array.isArray(listed))
      continue;
    hosted.set(name, listed as Entry[]);
  }
  /** The class of `entry`: the member's own, or a hosted package's. */
  const classOf = (entry: Entry): ClassRef | undefined => {
    if (typeof entry["from"] !== "string") {
      const own = ownClass(ir, entry["class"], entry["module"]);
      return own === undefined ? undefined : { name: own.name, from: own.importPath };
    }
    const row = hosted
      .get(entry["from"])
      ?.find((candidate) => candidate["class"] === entry["class"]);
    return typeof row?.["from"] === "string"
      ? { name: String(row["class"]), from: row["from"] }
      : undefined;
  };

  const endpoints: EncoreEndpoint[] = [];
  for (const entry of (manifest.actions ?? []) as readonly Entry[]) {
    const endpoint = entry["endpoint"] as { method?: unknown; path?: unknown } | false | undefined;
    if (typeof endpoint !== "object") continue;
    const declared = classOf(entry);
    if (declared === undefined) continue;
    const key = String(entry["key"]);
    // The input schema class types a GET or DELETE's query string; one the member does not declare coerces nothing.
    // shortcut: a hosted entry's input class is not known here, so its query string is not coerced; list the hosted
    // shapes' entries in the manifest when a hosted GET takes a number or a boolean.
    const shape =
      entry["input"] === undefined || typeof entry["from"] === "string"
        ? undefined
        : shapeOfRef(ir, entry["input"]);
    endpoints.push({
      kind: "call",
      name: camelCase(key.replace("@", "_v")),
      key,
      method: String(endpoint.method),
      path: String(endpoint.path),
      anonymous: entry["anonymous"] === true,
      class: declared,
      ...(shape === undefined ? {} : { input: { name: shape.name, from: shape.importPath } }),
    });
  }
  const controllers = [
    ...ir.classes
      .filter((declared) => declared.kind === "controller" && declared.abstract !== true)
      .map((declared) => ({
        name: declared.name,
        from: declared.importPath,
        path: declared.options["path"],
      })),
    ...[...hosted.values()].flat().map((row) => ({
      name: String(row["class"]),
      from: String(row["from"]),
      path: row["path"],
    })),
  ];
  for (const controller of controllers) {
    const { path } = controller;
    if (typeof path !== "string") continue;
    endpoints.push({
      kind: "controller",
      name: camelCase(controller.name),
      path,
      // Encore names a wildcard segment: `/api/auth/*` is `/api/auth/*rest`.
      route: path.endsWith("/*") ? `${path}rest` : path,
      class: { name: controller.name, from: controller.from },
    });
  }
  return endpoints;
}
