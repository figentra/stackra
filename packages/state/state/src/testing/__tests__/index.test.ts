/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: `createStore` and `mountStore`, the symbols the template
 *          imports from `@stackra/state/testing`, are exported and nothing else is; the `MountedStore` type resolves.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { Store, StoreStorageArea } from "#core/index";
import * as testing from "#testing/index";
import type { MountedStore } from "#testing/index";

describe("@stackra/state/testing", () => {
  it("exports exactly createStore and mountStore", () => {
    expect(Object.keys(testing).sort()).toEqual(["createStore", "mountStore"]);
  });

  it("resolves the MountedStore type", () => {
    expectTypeOf<MountedStore<Store>["store"]>().toEqualTypeOf<Store>();
    expectTypeOf<MountedStore<Store>["prefs"]>().toEqualTypeOf<StoreStorageArea>();
  });
});
