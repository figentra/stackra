/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the visibility filter driver, `registerVisibility` and the
 *          existence-only query service are exported, nothing else is, the registry and `whereOf` stay internal, and the public type resolves.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15); ADR 0333 (decision 4); STA-933.
 */
import type { AnyClass } from "@stackra/container";
import type { Rules } from "@stackra/rules";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { Decision } from "#core/index";
import * as node from "#node/index";
import type { VisibilityRegistration } from "#node/index";

describe("@stackra/iam/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "ExistenceQueryService",
      "IamVisibilityFilterDriver",
      "PostgresPolicySnapshotStoreDriver",
      "registerVisibility",
    ]);
  });

  it("resolves its public type", () => {
    expectTypeOf<VisibilityRegistration["model"]>().toEqualTypeOf<AnyClass>();
    expectTypeOf<VisibilityRegistration["rules"]>().toEqualTypeOf<Rules | undefined>();
    expectTypeOf<VisibilityRegistration["unmatched"]>().toEqualTypeOf<
      typeof Decision.Allow | typeof Decision.Deny
    >();
  });
});
