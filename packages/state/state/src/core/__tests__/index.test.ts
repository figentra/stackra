/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: `Store`, `StateConfig` and `StateConfig$` (the symbols the template
 *          imports from `@stackra/state`) and `registerStores` (the generated wiring's call) are exported and nothing
 *          else; the shipped schema is exported under its generated name; the public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { STATE_CONFIG_SCHEMA } from "#core/constants/state-config-schema.constant";
import * as state from "#core/index";
import type {
  StoreClass,
  StoreOptions,
  StorePatch,
  StoreStorage,
  StoreStorageArea,
} from "#core/index";

describe("@stackra/state", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(state).sort()).toEqual([
      "StateConfig",
      "StateConfig$",
      "Store",
      "registerStores",
    ]);
  });

  it("exports the shipped schema under its generated name", () => {
    expect(state.StateConfig$).toBe(STATE_CONFIG_SCHEMA);
  });

  it("resolves its public types", () => {
    expectTypeOf<StoreOptions>().toEqualTypeOf<{ readonly persist: string }>();
    expectTypeOf<StoreStorage["area"]>().returns.toEqualTypeOf<StoreStorageArea>();
    expectTypeOf<StoreClass>().toBeConstructibleWith();
    expectTypeOf<StorePatch<object>>().toMatchTypeOf<
      Readonly<Record<string, unknown>> | ((state: object) => Readonly<Record<string, unknown>>)
    >();
  });
});
