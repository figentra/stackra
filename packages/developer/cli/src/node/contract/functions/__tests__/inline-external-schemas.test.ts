/**
 * Stackra file contract:
 * Purpose: unit tests of `inlineExternalSchemas`: a `<package>#/schemas/<name>` reference in a path or a component
 *          becomes a local component copied from that package's manifest, the shape's own `#/schemas/` references
 *          follow transitively (each shape once, cycles included), local references stay as they are, a shape no
 *          manifest holds only names itself, and the input document is left unchanged.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (decision 4); ADR 0158; STA-2837.
 */
import type { StackraManifest } from "@stackra/contracts";
import type { OpenApiDocument } from "@stackra/gen";
import { describe, expect, it } from "@stackra/testing";

import { inlineExternalSchemas } from "#node/contract/functions/inline-external-schemas.function";

const host = (): OpenApiDocument =>
  ({
    $comment: "fixture",
    openapi: "3.1.0",
    info: { title: "@acme/service-billing", version: "1.0.0", "x-stackra-member": "billing" },
    paths: {
      "/app/invoices/{id}/void": {
        post: {
          requestBody: {
            content: {
              "application/json": { schema: { $ref: "@acme/ledger#/schemas/ledger.VoidInput" } },
            },
          },
          responses: { "200": { $ref: "#/components/responses/Refusal" } },
        },
      },
    },
    components: {
      schemas: {
        "billing.Invoice": {
          type: "object",
          properties: {
            entry: { $ref: "@acme/ledger#/schemas/ledger.Entry" },
            missing: { $ref: "@acme/gone#/schemas/gone.Shape" },
          },
        },
      },
      responses: { Refusal: { description: "refused" } },
    },
  }) as unknown as OpenApiDocument;

const ledger = {
  member: "ledger",
  package: "@acme/ledger",
  version: "1.0.0",
  schemas: {
    "ledger.VoidInput": {
      type: "object",
      properties: { entry: { $ref: "#/schemas/ledger.Entry" } },
      required: ["entry"],
    },
    "ledger.Entry": {
      type: "object",
      properties: { parent: { $ref: "#/schemas/ledger.Entry" } },
    },
  },
} as unknown as StackraManifest;

describe("inlineExternalSchemas", () => {
  it("brings each referenced shape in as a local component, transitively and once", () => {
    const document = host();
    const before = JSON.stringify(document);
    const inlined = inlineExternalSchemas(document, (name) =>
      name === "@acme/ledger" ? ledger : undefined,
    );
    expect(JSON.stringify(document)).toBe(before);
    expect(inlined.paths["/app/invoices/{id}/void"]?.["post"]).toEqual({
      requestBody: {
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/_acme_ledger.ledger.VoidInput" },
          },
        },
      },
      responses: { "200": { $ref: "#/components/responses/Refusal" } },
    });
    expect(inlined.components.schemas).toEqual({
      "billing.Invoice": {
        type: "object",
        properties: {
          entry: { $ref: "#/components/schemas/_acme_ledger.ledger.Entry" },
          missing: { $ref: "#/components/schemas/_acme_gone.gone.Shape" },
        },
      },
      "_acme_ledger.ledger.VoidInput": {
        type: "object",
        properties: { entry: { $ref: "#/components/schemas/_acme_ledger.ledger.Entry" } },
        required: ["entry"],
      },
      "_acme_ledger.ledger.Entry": {
        type: "object",
        properties: { parent: { $ref: "#/components/schemas/_acme_ledger.ledger.Entry" } },
      },
      "_acme_gone.gone.Shape": { "x-stackra-unresolved": "@acme/gone#/schemas/gone.Shape" },
    });
    expect(inlined.components.responses).toEqual({ Refusal: { description: "refused" } });
  });

  it("leaves a document with no external reference as it was", () => {
    const document = { ...host(), paths: {} } as OpenApiDocument;
    const local = {
      ...document,
      components: { ...document.components, schemas: { "billing.Id": { type: "string" } } },
    } as OpenApiDocument;
    expect(inlineExternalSchemas(local, () => undefined)).toEqual(local);
  });
});
