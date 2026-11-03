/**
 * Stackra file contract:
 * Purpose: `openApiOf`, the projection of a member's manifest to its `openapi.json`: OpenAPI 3.1 with one operation
 *          per action or query that has an endpoint (path parameters from `:name` segments, query parameters for a
 *          GET, the input as the JSON body otherwise, an `Idempotency-Key` header on a write, the output or 204, one
 *          response per HTTP status of the action's refusal kinds and the shared ADR 0140 envelope as `default`),
 *          the bearer security scheme, the manifest's shapes as components, and `x-stackra-*` extensions for the
 *          key, permission, risk, idempotency, cache and refusal codes.
 * Boundary: pure and deterministic: paths and operations follow the manifest's order, so projecting the committed
 *           manifest reproduces the committed `openapi.json` byte for byte. Never a source for clients (ADR 0158).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 10: openapi.json beside the manifest); ADR 0158; ADR 0140 (the error
 *                     envelope and statuses); ADR 0082 (bearer auth; an anonymous-callable call is public, STA-2025);
 *                     ADR 0136 (the Idempotency-Key header).
 */
import { Enum, type Json, type StackraManifest } from "@stackra/contracts";
import { ErrorKind } from "@stackra/errors";

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

/** The ten ADR 0140 categories. */
const CATEGORIES: readonly string[] = Enum.values(ErrorKind).map(
  (kind) => Enum.meta(ErrorKind, kind).category,
);

/** The ADR 0140 refusal envelope; `codes` narrows `code` when given. */
function refusal(description: string, category: Json, codes?: readonly string[]): JsonObject {
  return {
    description,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["code", "category", "retryable"],
          properties: {
            code: codes === undefined ? { type: "string" } : { type: "string", enum: [...codes] },
            category,
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
}

/** The shared `default` refusal: any code, any of the ten categories. */
const REFUSAL: JsonObject = refusal(
  "The call was refused; `code` names the refusal and `category` its kind.",
  { type: "string", enum: [...CATEGORIES] },
);

/** The refusal responses of `codes`, one per HTTP status of the kinds the manifest's `errors` give them. */
function refusalResponses(
  codes: readonly string[],
  errors: NonNullable<StackraManifest["errors"]>,
): Record<string, Json> {
  const byStatus = new Map<number, { category: string; codes: string[] }>();
  for (const code of codes) {
    const entry = errors.find((candidate) => candidate["code"] === code);
    const kind = entry?.["kind"];
    if (typeof kind !== "string" || !(Enum.values(ErrorKind) as readonly string[]).includes(kind))
      continue;
    const meta = Enum.meta(ErrorKind, kind as ErrorKind);
    const found = byStatus.get(meta.httpStatus) ?? { category: meta.category, codes: [] };
    found.codes.push(code);
    byStatus.set(meta.httpStatus, found);
  }
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here; toSorted is ES2023 and the base lib is ES2022
  const ordered = [...byStatus.entries()].sort(([left], [right]) => left - right);
  return Object.fromEntries(
    ordered.map(([status, { category, codes: listed }]) => [
      String(status),
      refusal(`Refused: ${listed.join(", ")}.`, { type: "string", const: category }, listed),
    ]),
  );
}

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
  const errors = manifest.errors ?? [];
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
    if (action["anonymous"] === true) operation["security"] = [];
    if (method !== "get")
      parameters.push({
        name: "Idempotency-Key",
        in: "header",
        required: action["idempotency"] === "required",
        schema: { type: "string" },
      });
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
      ...refusalResponses(
        Array.isArray(action["refusals"]) ? action["refusals"].map(String) : [],
        errors,
      ),
      default: { $ref: "#/components/responses/Refusal" },
    };
    paths[path] = { ...paths[path], [method]: operation };
  }
  return {
    openapi: "3.1.0",
    "x-stackra-generated": `${GENERATED_NOTICE}; the projection of stackra.manifest.json (ADR 0158)`,
    info: {
      title: manifest.package,
      version: manifest.version,
      "x-stackra-member": manifest.member,
    },
    paths,
    security: [{ bearer: [] }],
    components: {
      securitySchemes: {
        bearer: {
          type: "http",
          scheme: "bearer",
          description:
            "An API key or an OAuth access token, sent as `Authorization: Bearer <token>`.",
        },
      },
      schemas: Object.fromEntries(
        Object.entries(schemas).map(([name, schema]) => [name, rehome(schema)]),
      ),
      responses: { Refusal: REFUSAL },
    },
  };
}
