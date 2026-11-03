/**
 * Stackra file contract:
 * Purpose: `OpenApiDocument`, the `openapi.json` gen projects from a member's manifest: OpenAPI 3.1 (root `x-stackra-generated`, no `$comment`) with the
 *          `x-stackra-*` extensions that carry permission, risk, idempotency, cache and refusal codes.
 * Boundary: a type only. The document is a projection for external consumers and docs, never a source for clients
 *           (ADR 0294 decision 10, ADR 0158).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 10); ADR 0158; ADR 0140 (refusal statuses); ADR 0118 (dated versions).
 */
import type { Json } from "@stackra/contracts";

/** A member's `openapi.json`. */
export interface OpenApiDocument {
  /** The generated-file notice. */
  readonly "x-stackra-generated": string;

  /** The OpenAPI version, always `3.1.0`. */
  readonly openapi: string;

  /** The package name and version, and the member key. */
  readonly info: {
    readonly title: string;
    readonly version: string;
    readonly "x-stackra-member": string;
  };

  /** Path (with `{param}` segments) to lower-case method to operation. */
  readonly paths: Readonly<Record<string, Readonly<Record<string, Json>>>>;

  /** The bearer requirement every operation has unless it overrides it with `[]` (ADR 0082). */
  readonly security: readonly Json[];

  /** The security scheme, the shapes the operations reference, and the shared refusal response. */
  readonly components: {
    readonly securitySchemes: Readonly<Record<string, Json>>;
    readonly schemas: Readonly<Record<string, Json>>;
    readonly responses: Readonly<Record<string, Json>>;
  };
}
