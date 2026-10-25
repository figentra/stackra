/**
 * Stackra file contract:
 * Purpose: `OpenApiDocument`, the `openapi.json` gen projects from a member's manifest: OpenAPI 3.1 with the
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
  readonly $comment: string;

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

  /** The shapes the operations reference, and the shared refusal response. */
  readonly components: {
    readonly schemas: Readonly<Record<string, Json>>;
    readonly responses: Readonly<Record<string, Json>>;
  };
}
