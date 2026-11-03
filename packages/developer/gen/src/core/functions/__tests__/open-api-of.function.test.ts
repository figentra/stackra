/**
 * Stackra file contract:
 * Purpose: unit tests of `openApiOf`: one operation per endpoint with its path and query parameters, body, responses,
 *          refusal reference and `x-stackra-*` extensions, `auth: false` as an empty security list, the manifest's
 *          shapes as components with rewritten references, and a deterministic projection.
 * Boundary: test only; projects the manifest built from the commerce IR fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 10); ADR 0158; ADR 0140.
 */
import { describe, expect, it } from "@stackra/testing";

import { GENERATED_NOTICE } from "#core/constants/generated-notice.constant";
import { buildManifest } from "#core/functions/build-manifest.function";
import { openApiOf } from "#core/functions/open-api-of.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

/** The `Idempotency-Key` parameter of an operation. */
const header = (operation: unknown): unknown =>
  (operation as { parameters?: { name: string }[] }).parameters?.find(
    (parameter) => parameter.name === "Idempotency-Key",
  );

describe("openApiOf", () => {
  const { manifest } = buildManifest(COMMERCE_IR);
  const document = openApiOf(manifest);

  it("carries the header and the components", () => {
    expect(document.openapi).toBe("3.1.0");
    expect(document["x-stackra-generated"].startsWith(GENERATED_NOTICE)).toBe(true);
    expect(document).not.toHaveProperty("$comment");
    expect(document.security).toEqual([{ bearer: [] }]);
    expect(document.components.securitySchemes["bearer"]).toMatchObject({
      type: "http",
      scheme: "bearer",
    });
    expect(document.info).toEqual({
      title: "@acme/service-commerce",
      version: "1.2.0",
      "x-stackra-member": "commerce",
    });
    expect(document.components.schemas["orders.ListOrdersOutput"]).toMatchObject({
      properties: {
        items: { type: "array", items: { $ref: "#/components/schemas/orders.OrderView" } },
      },
    });
    expect(document.components.responses["Refusal"]).toBeDefined();
  });

  it("projects an action with a path parameter and a body", () => {
    expect(document.paths["/orders/{orderId}/cancel"]?.["put"]).toMatchObject({
      operationId: "orders_order_cancel",
      tags: ["orders"],
      "x-stackra-action": "orders.order.cancel@1",
      "x-stackra-permission": "orders.order.cancel",
      "x-stackra-risk": "L2",
      "x-stackra-idempotency": { ttl: "PT24H" },
      "x-stackra-refusals": ["order_not_cancellable"],
      parameters: [
        {
          name: "orderId",
          in: "path",
          required: true,
          schema: { type: "string", pattern: "^ord_[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$" },
        },
        { name: "Idempotency-Key", in: "header", required: false, schema: { type: "string" } },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/orders.CancelOrderInput" } },
        },
      },
      responses: {
        "200": {
          description: "OK",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/orders.CancelOrderOutput" },
            },
          },
        },
        default: { $ref: "#/components/responses/Refusal" },
      },
    });
  });

  it("projects a query with query parameters and a public endpoint", () => {
    expect(document.paths["/orders"]?.["get"]).toMatchObject({
      parameters: [
        { name: "cursor", in: "query", required: false, schema: { type: "string" } },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        },
      ],
    });
    expect(document.paths["/orders"]?.["get"]).not.toHaveProperty("requestBody");
    const open = openApiOf({
      ...manifest,
      actions: (manifest.actions ?? []).map((action) => ({ ...action, anonymous: true })),
    });
    expect(open.paths["/orders"]?.["get"]).toMatchObject({ security: [] });
  });

  it("declares Idempotency-Key on writes only, required when idempotency is required", () => {
    const required = openApiOf({
      ...manifest,
      actions: (manifest.actions ?? []).map((action) => ({ ...action, idempotency: "required" })),
    });
    expect(header(required.paths["/orders/{orderId}/cancel"]?.["put"])).toMatchObject({
      required: true,
    });
    expect(header(document.paths["/orders"]?.["get"])).toBeUndefined();
    for (const idempotency of ["optional", "derived"]) {
      const declared = openApiOf({
        ...manifest,
        actions: (manifest.actions ?? []).map((action) => ({ ...action, idempotency })),
      });
      expect(header(declared.paths["/orders/{orderId}/cancel"]?.["put"])).toMatchObject({
        required: false,
      });
    }
  });

  it("declares Idempotency-Key on a DELETE or PATCH without input (EC-07)", () => {
    for (const method of ["DELETE", "PATCH"]) {
      const bare = openApiOf({
        ...manifest,
        actions: (manifest.actions ?? []).map((action) => ({
          ...action,
          endpoint: { method, path: "/orders/:orderId", derived: false },
          input: undefined,
        })),
      });
      const operation = bare.paths["/orders/{orderId}"]?.[method.toLowerCase()];
      expect(header(operation)).toMatchObject({ in: "header", required: false });
      expect(operation).not.toHaveProperty("requestBody");
    }
  });

  it("lists two codes of one kind in one status response (EC-03)", () => {
    const twin = openApiOf({
      ...manifest,
      errors: [
        ...(manifest.errors ?? []),
        { code: "order_locked", kind: "failed_precondition", category: "precondition_failed" },
      ],
      actions: (manifest.actions ?? []).map((action) => ({
        ...action,
        refusals: ["order_not_cancellable", "order_locked"],
      })),
    });
    const operation = twin.paths["/orders/{orderId}/cancel"]?.["put"] as {
      responses: Record<string, { content: { "application/json": { schema: unknown } } }>;
    };
    expect(Object.keys(operation.responses)).toEqual(["200", "412", "default"]);
    expect(operation.responses["412"]?.content["application/json"].schema).toMatchObject({
      properties: {
        code: { enum: ["order_not_cancellable", "order_locked"] },
        category: { const: "precondition_failed" },
      },
    });
  });

  it("answers refusals per status with a code and a category enum", () => {
    const operation = document.paths["/orders/{orderId}/cancel"]?.["put"] as {
      responses: Record<string, { content: { "application/json": { schema: unknown } } }>;
    };
    expect(Object.keys(operation.responses)).toEqual(["200", "412", "default"]);
    expect(operation.responses["412"]?.content["application/json"].schema).toMatchObject({
      properties: {
        code: { enum: ["order_not_cancellable"] },
        category: { const: "precondition_failed" },
      },
    });
    const refusal = document.components.responses["Refusal"] as {
      content: { "application/json": { schema: { properties: { category: { enum: string[] } } } } };
    };
    expect(refusal.content["application/json"].schema.properties.category.enum).toHaveLength(10);
  });

  it("leaves a refusal the manifest does not list under default (EC-02)", () => {
    const unknown = openApiOf({
      ...manifest,
      actions: (manifest.actions ?? []).map((action) => ({ ...action, refusals: ["other_code"] })),
    });
    const operation = unknown.paths["/orders/{orderId}/cancel"]?.["put"] as {
      responses: object;
    };
    expect(Object.keys(operation.responses)).toEqual(["200", "default"]);
  });

  it("is deterministic", () => {
    expect(JSON.stringify(openApiOf(manifest))).toBe(JSON.stringify(document));
  });
});
