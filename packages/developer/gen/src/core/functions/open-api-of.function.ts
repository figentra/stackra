/**
 * Stackra file contract:
 * Purpose: `openApiOf`, the projection of a member's manifest to its `openapi.json`: OpenAPI 3.1 with one operation
 *          per action or query that has an endpoint (path parameters from `:name` segments, query parameters for a
 *          GET, the input as the JSON body otherwise, the output or 204, and the shared refusal response with the
 *          ADR 0140 envelope), the manifest's shapes as components, and `x-stackra-*` extensions for the key,
 *          permission, risk, idempotency, cache and refusal codes.
 * Boundary: pure and deterministic: paths and operations follow the manifest's order, so projecting the committed
 *           manifest reproduces the committed `openapi.json` byte for byte. Never a source for clients (ADR 0158).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 10: openapi.json beside the manifest); ADR 0158; ADR 0140 (the error
 *                     envelope and statuses); ADR 0082 (`auth: false`).
 */
import type { Json, StackraManifest } from "@stackra/contracts";

import { GENERATED_NOTICE } from "#core/constants/generated-notice.constant";
import { toolName } from "#core/functions/tool-name.function";
import type { OpenApiDocument } from "#core/types/open-api-document.type";

/** A JSON object under construction. */
type JsonObject = { [key: string]: Json };

/** Whether a JSON value is an object. */
function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Rewrites manifest `$ref`s (`#/schemas/x`) to component references (`#/components/schemas/x`). */
function rehome(value: unknown): Json {
  if (Array.isArray(value)) return value.map(rehome);
  if (!isObject(value)) return (value ?? null) as Json;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      key === "$ref" && typeof item === "string" && item.startsWith("#/schemas/")
        ? `#/components/schemas/${item.slice("#/schemas/".length)}`
        : rehome(item),
    ]),
  );
}

/** The ADR 0140 refusal envelope every operation may answer with. */
const REFUSAL: JsonObject = {
  description: "The call was refused; `code` names the refusal and `category` its kind.",
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["code", "category", "retryable"],
        properties: {
          code: { type: "string" },
          category: { type: "string" },
          retryable: { type: "boolean" },
          details: { type: "object" },
          fieldErrors: { type: "object" },
          correlationId: { type: "string" },
          action: { type: "string" },
        },
      },
    },
  },
};

/**
 * The `openapi.json` of `manifest`.
 *
 * @param manifest - a member's manifest.
 * @example
 * openApiOf(manifest).paths["/orders/{orderId}/cancel"]?.["put"];
 */
export function openApiOf(manifest: StackraManifest): OpenApiDocument {
  const schemas = isObject(manifest.schemas) ? manifest.schemas : {};
  const resolve = (node: unknown): JsonObject | undefined => {
    if (!isObject(node)) return undefined;
    const target = node["$ref"];
    if (typeof target !== "string" || !target.startsWith("#/schemas/")) return node;
    const found = schemas[target.slice("#/schemas/".length)];
    return isObject(found) ? found : undefined;
  };
  const paths: Record<string, Record<string, Json>> = {};
  for (const action of manifest.actions ?? []) {
    const endpoint = action["endpoint"];
    if (
      !isObject(endpoint) ||
      typeof endpoint["method"] !== "string" ||
      typeof endpoint["path"] !== "string"
    )
      continue;
    const method = endpoint["method"].toLowerCase();
    const path = endpoint["path"].replaceAll(/:(\w+)/g, "{$1}");
    const pathParameters = [...endpoint["path"].matchAll(/:(\w+)/g)].map((match) => match[1] ?? "");
    const input = resolve(action["input"]);
    const properties = isObject(input?.["properties"]) ? input["properties"] : {};
    const required = Array.isArray(input?.["required"]) ? input["required"].map(String) : [];
    const parameters: Json[] = pathParameters.map((name) => ({
      name,
      in: "path",
      required: true,
      schema: rehome(properties[name] ?? { type: "string" }),
    }));
    if (method === "get")
      for (const [name, schema] of Object.entries(properties))
        if (!pathParameters.includes(name))
          parameters.push({
            name,
            in: "query",
            required: required.includes(name),
            schema: rehome(schema),
          });
    const operation: JsonObject = {
      operationId: toolName(action.key),
      summary: action.class,
      tags: [action.module],
      "x-stackra-action": action.key,
      "x-stackra-permission": action.permission,
      "x-stackra-risk": action.risk,
    };
    for (const option of ["idempotency", "cache"] as const)
      if (action[option] !== undefined) operation[`x-stackra-${option}`] = rehome(action[option]);
    if (Array.isArray(action["refusals"]))
      operation["x-stackra-refusals"] = action["refusals"].map(String);
    if (action["auth"] === false) operation["security"] = [];
    if (parameters.length > 0) operation["parameters"] = parameters;
    if (method !== "get" && action["input"] !== undefined)
      operation["requestBody"] = {
        required: true,
        content: { "application/json": { schema: rehome(action["input"]) } },
      };
    operation["responses"] = {
      ...(action["output"] !== undefined
        ? {
            "200": {
              description: "OK",
              content: { "application/json": { schema: rehome(action["output"]) } },
            },
          }
        : { "204": { description: "No Content" } }),
      default: { $ref: "#/components/responses/Refusal" },
    };
    paths[path] = { ...paths[path], [method]: operation };
  }
  return {
    $comment: `${GENERATED_NOTICE}; the projection of stackra.manifest.json (ADR 0158)`,
    openapi: "3.1.0",
    info: {
      title: manifest.package,
      version: manifest.version,
      "x-stackra-member": manifest.member,
    },
    paths,
    components: {
      schemas: Object.fromEntries(
        Object.entries(schemas).map(([name, schema]) => [name, rehome(schema)]),
      ),
      responses: { Refusal: REFUSAL },
    },
  };
}
