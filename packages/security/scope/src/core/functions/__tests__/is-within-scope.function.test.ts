/**
 * Stackra file contract:
 * Purpose: unit tests of `isWithinScope`: a path is within its own scope and below it, never beside it, above it, or
 *          under a label that only starts the same.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decisions 3 and 7).
 */
import { describe, expect, it } from "@stackra/testing";

import { isWithinScope } from "#core/functions/is-within-scope.function";

describe(isWithinScope, () => {
  it.each([
    ["platform.acme", "platform.acme", true],
    ["platform.acme.eu", "platform.acme", true],
    ["platform.acme.eu.riyadh", "platform", true],
    ["platform.acme_eu", "platform.acme", false],
    ["platform", "platform.acme", false],
    ["platform.other", "platform.acme", false],
  ])("%s within %s is %s", (path, scope, expected) => {
    expect(isWithinScope(path, scope)).toBe(expected);
  });
});
