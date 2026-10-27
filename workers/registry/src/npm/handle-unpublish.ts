/**
 * Stackra file contract:
 * Purpose: `handleUnpublish`: `DELETE` of a package or version: versions are immutable.
 * Boundary: reads only; never proxies an upstream (an unknown name is 404).
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 4, 5, 9, 10 and 13).
 */
import { failure } from "#src/http/failure";

/** `DELETE` of a package or version: versions are immutable. */
export const handleUnpublish = (): Response =>
  failure(405, "unpublish is not supported: deprecate the version instead", { allow: "GET, PUT" });
