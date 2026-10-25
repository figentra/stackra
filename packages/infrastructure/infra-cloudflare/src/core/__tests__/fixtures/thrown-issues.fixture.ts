/**
 * Stackra file contract:
 * Purpose: test fixture: `thrownIssues(run)`, the issues of the `CloudflareConfigInvalidError` that `run` throws, so a
 *          test asserts the paths and messages; anything else thrown, or nothing, fails the test.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement).
 */
import type { RunwayIssue } from "@stackra/runway";

import { CloudflareConfigInvalidError } from "#core/errors/cloudflare-config-invalid.error";

/** The issues `run` throws. */
export function thrownIssues(run: () => unknown): readonly RunwayIssue[] {
  try {
    run();
  } catch (error) {
    if (error instanceof CloudflareConfigInvalidError) return error.issues;
    throw error;
  }
  throw new Error("Expected a CloudflareConfigInvalidError");
}
