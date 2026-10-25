/**
 * Stackra file contract:
 * Purpose: `inlineSchemaRefs`, a manifest schema with every `$ref` into a manifest's `schemas` replaced by the schema
 *          it names, so an MCP client gets a self-contained `inputSchema`. A local ref (`#/schemas/orders.X`) reads
 *          the manifest it came from; a rehomed ref (`@acme/loyalty-kit#/schemas/loyalty_kit.X`, which gen writes for
 *          a hosted package) reads that package's manifest.
 * Boundary: pure. A ref it cannot find, or one that points back into itself, is left as written.
 * Runtime: isomorphic
 * Governing contract: ADR 0155 (decision 4: the gateway builds tools from the manifests); ADR 0294 (decision 22).
 */
import type { Json, StackraManifest } from "@stackra/contracts";

/** The `#/schemas/` marker of a manifest schema reference. */
const SCHEMAS = "#/schemas/";

/**
 * The schema with its manifest refs inlined.
 *
 * @param value - a schema, or any part of one.
 * @param home - the manifest the value was read from.
 * @param manifests - every manifest of the table, for rehomed refs.
 * @param seen - the refs being inlined on this path; a ref met again stays a ref.
 * @example
 * inlineSchemaRefs({ $ref: "#/schemas/orders.CancelOrderInput" }, commerce, [commerce]);
 * // { type: "object", properties: { orderId: { type: "string" } }, ... }
 */
export function inlineSchemaRefs(
  value: Json,
  home: StackraManifest,
  manifests: readonly StackraManifest[],
  seen: ReadonlySet<string> = new Set(),
): Json {
  if (Array.isArray(value))
    return value.map((item) => inlineSchemaRefs(item, home, manifests, seen));
  if (typeof value !== "object" || value === null) return value;
  const ref = value["$ref"];
  if (typeof ref === "string" && ref.includes(SCHEMAS) && !seen.has(ref)) {
    const at = ref.indexOf(SCHEMAS);
    const owner =
      at === 0 ? home : manifests.find((manifest) => manifest.package === ref.slice(0, at));
    const schemas = owner?.schemas;
    const target =
      schemas !== undefined &&
      typeof schemas === "object" &&
      schemas !== null &&
      !Array.isArray(schemas)
        ? schemas[ref.slice(at + SCHEMAS.length)]
        : undefined;
    if (owner !== undefined && target !== undefined)
      return inlineSchemaRefs(target, owner, manifests, new Set([...seen, ref]));
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      inlineSchemaRefs(item as Json, home, manifests, seen),
    ]),
  );
}
