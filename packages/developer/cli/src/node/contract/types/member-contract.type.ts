/**
 * Stackra file contract:
 * Purpose: `MemberContract`, one member's HTTP contract at the base commit and now: the OpenAPI projection of its
 *          `stackra.manifest.json` on each side, or a problem when a side cannot be read.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4); ADR 0158 (openapi.json is a projection of the manifest); STA-2837.
 */
import type { OpenApiDocument } from "@stackra/gen";

/** A member whose contract existed at the base commit. */
export type MemberContract = {
  /** The member folder, repository-relative. */
  readonly dir: string;

  /** The projection at the base commit. */
  readonly base: OpenApiDocument;

  /** The projection now; a removed member projects to no path at all. */
  readonly next: OpenApiDocument;
};
