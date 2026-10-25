/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/feature-flags`
 *          (`Flag`, `FeatureFlagsConfig`, `FlagTargeting`, `flagRefs`; the generated `FeatureFlagsConfig$`,
 *          `ConfigFlagProviderDriver` and `PosthogFlagProviderDriver`) and the registry row's reader are exported,
 *          nothing else is, the `$` name is the shipped schema, the port stays in `./contracts`, and the public types
 *          resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { FEATURE_FLAGS_CONFIG_SCHEMA } from "#core/constants/feature-flags-config-schema.constant";
import * as flags from "#core/index";
import type {
  FlagClass,
  FlagOptions,
  FlagProviderName,
  FlagRef,
  FlagRefInput,
  FlagRefs,
  FlagScope,
  FlagSubjects,
} from "#core/index";

describe("@stackra/feature-flags", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(flags).sort()).toEqual([
      "ConfigFlagProviderDriver",
      "FeatureFlagsConfig",
      "FeatureFlagsConfig$",
      "FeatureFlagsOptions",
      "Flag",
      "FlagReader",
      "FlagTargeting",
      "PosthogFlagProviderDriver",
      "flagRefs",
    ]);
  });

  it("exports the shipped schema under its generated name", () => {
    expect(flags.FeatureFlagsConfig$).toBe(FEATURE_FLAGS_CONFIG_SCHEMA);
  });

  it("resolves its public types", () => {
    expectTypeOf<FlagProviderName>().toEqualTypeOf<"config" | "posthog">();
    expectTypeOf<FlagScope>().toEqualTypeOf<"platform" | "product" | "tenant" | "node" | "user">();
    expectTypeOf<FlagOptions["default"]>().toEqualTypeOf<boolean>();
    expectTypeOf<FlagRef<"web.help_centre">["key"]>().toEqualTypeOf<"web.help_centre">();
    expectTypeOf<FlagRefInput["key"]>().toEqualTypeOf<string>();
    expectTypeOf<
      FlagRefs<{ web: { help_centre: FlagClass } }>["web"]["help_centre"]
    >().toEqualTypeOf<FlagRef<"web.help_centre">>();
    expectTypeOf<keyof FlagSubjects>().toEqualTypeOf<"visitor" | "user" | "tenant">();
  });
});
