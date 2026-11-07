/**
 * Stackra file contract:
 * Purpose: unit tests of `KIND_RECORDS` and `PERMISSION_REGISTRY`: each is the one process-wide registry on
 *          `globalThis`, so a second installed copy of the package (which reads the same `Symbol.for` key) shares it.
 * Boundary: test only; reads the globals, registers nothing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 25).
 */
import { describe, expect, it } from "@stackra/testing";

import { KIND_RECORDS } from "#core/constants/kind-records.constant";
import { PERMISSION_REGISTRY } from "#core/constants/permission-registry.constant";

/** The process globals, read the way a second copy of the package reads them. */
const GLOBALS = globalThis as Record<symbol, unknown>;

/** The registries a duplicate install must share with this copy. */
describe("container registries", () => {
  /** A second copy resolves `Symbol.for` to the same key, so it finds this registry instead of making its own. */
  it("keeps the kind registry on globalThis", () => {
    expect(GLOBALS[Symbol.for("@stackra/container/kind-records")]).toBe(KIND_RECORDS);
  });

  /** The permission registry follows the same rule. */
  it("keeps the permission registry on globalThis", () => {
    expect(GLOBALS[Symbol.for("@stackra/container/permission-registry")]).toBe(PERMISSION_REGISTRY);
  });
});
