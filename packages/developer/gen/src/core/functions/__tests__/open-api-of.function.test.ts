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

describe("openApiOf", () => {
  const { manifest } = buildManifest(COMMERCE_IR);
  const document = openApiOf(manifest);

  it("carries the header and the components", () => {
    expect(document.openapi).toBe("3.1.0");
    expect(document.$comment.startsWith(GENERATED_NOTICE)).toBe(true);
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
          schema: { type: "string", pattern: "^ord_[0-9A-Za-z]{26}$" },
        },
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
      actions: (manifest.actions ?? []).map((action) => ({ ...action, auth: false })),
    });
    expect(open.paths["/orders"]?.["get"]).toMatchObject({ security: [] });
  });

  it("is deterministic", () => {
    expect(JSON.stringify(openApiOf(manifest))).toBe(JSON.stringify(document));
  });
});
