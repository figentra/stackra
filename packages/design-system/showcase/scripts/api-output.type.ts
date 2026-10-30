/**
 * Stackra file contract:
 * Purpose: `ApiOutput`, what gen-api returns: output files (path relative to the package -> content), the ApiDocs and warnings.
 * Boundary: a type only, in its own file (ADR 0305).
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */
import type { ApiDoc } from "../src/types/api-doc.type.ts";

/** The result of one gen-api run. */
export interface ApiOutput {
  readonly files: Map<string, string>;
  readonly docs: readonly ApiDoc[];
  readonly warnings: readonly string[];
}
