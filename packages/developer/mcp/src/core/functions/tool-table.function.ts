/**
 * Stackra file contract:
 * Purpose: `toolTable`, the hosted MCP server's tool table, built from committed manifests: one row per action or
 *          query that carries a `tool` entry (gen writes one for every query and every action a user can perform
 *          unless it says `tool: false` with a reason), with its input schema inlined and gen's derived hints as the
 *          MCP annotations. The first manifest to list a tool name wins, so a hosted package that also passes its own
 *          manifest is not listed twice.
 * Boundary: pure. No permission or entitlement is applied here (that is `filterTools`, per caller); no tool is ever
 *           hand-added or hand-annotated.
 * Runtime: isomorphic
 * Governing contract: ADR 0155 (decisions 1 and 4, as amended by ADR 0360 decision 4 and ADR 0348); ADR 0099
 *                     (decision 3: hints are derived).
 */
import type { Json, StackraManifest } from "@stackra/contracts";

import { inlineSchemaRefs } from "#core/functions/inline-schema-refs.function";
import type { HostedTool } from "#core/types/hosted-tool.type";

/** Whether a value is a plain JSON object. */
function isObject(value: unknown): value is { readonly [key: string]: Json } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Every tool the manifests offer, sorted by name.
 *
 * @param manifests - the committed `stackra.manifest.json` of each member the server fronts.
 * @example
 * const tools = toolTable([commerceManifest]);
 * tools[0]; // { name: "orders_order_cancel", action: "orders.order.cancel@1", annotations: { … }, … }
 */
export function toolTable(manifests: readonly StackraManifest[]): HostedTool[] {
  const byName = new Map<string, HostedTool>();
  for (const manifest of manifests)
    for (const action of manifest.actions ?? []) {
      const tool = action["tool"];
      if (!isObject(tool) || typeof tool["name"] !== "string" || byName.has(tool["name"])) continue;
      const input =
        action["input"] === undefined
          ? undefined
          : inlineSchemaRefs(action["input"] as Json, manifest, manifests);
      const hints = isObject(tool["hints"]) ? tool["hints"] : {};
      const description = action["description"];
      byName.set(tool["name"], {
        name: tool["name"],
        ...(typeof description === "string" ? { description } : {}),
        inputSchema: isObject(input) ? input : { type: "object", properties: {} },
        annotations: Object.fromEntries(
          Object.entries(hints).filter(
            (entry): entry is [string, boolean] => typeof entry[1] === "boolean",
          ),
        ),
        action: action.key,
        member: manifest.member,
        permission: action.permission,
        risk: action.risk,
        effects: Array.isArray(action["effects"]) ? action["effects"].map(String) : [],
      });
    }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}
