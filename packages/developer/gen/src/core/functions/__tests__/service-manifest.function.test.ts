/**
 * Stackra file contract:
 * Purpose: unit tests of `serviceManifest`: a consumed service resolves from `ir.services` (a sibling folder or a
 *          contract package) and never from a dependency that merely shares its member name (STA-1820).
 * Boundary: test only; runs on the commerce IR fixture's manifest.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0260 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { serviceManifest } from "#core/functions/service-manifest.function";
import type { MemberIR } from "#core/types/member-ir.type";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

const COMMERCE = buildManifest(COMMERCE_IR).manifest;

describe("serviceManifest", () => {
  it("finds a service in ir.services", () => {
    const ir: MemberIR = { ...COMMERCE_IR, services: [{ member: "commerce", manifest: COMMERCE }] };
    expect(serviceManifest(ir, "commerce")).toBe(COMMERCE);
  });

  it("does not fall back to a dependency with the same member name", () => {
    const ir: MemberIR = {
      ...COMMERCE_IR,
      services: [],
      dependencies: [{ package: "@stackra/commerce", manifest: COMMERCE }],
    };
    expect(serviceManifest(ir, "commerce")).toBeUndefined();
  });
});
