/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: every symbol the template imports from
 *          `@stackra/gen/testing` (`discoverWithGen`, `expectBackwardCompatible`, `loadManifest`, `loadOpenApi`,
 *          `previousRelease`, `projectOpenApi`) is exported, nothing else is, and the public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; registry v3.1 (the gen row's template imports).
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as testing from "#testing/index";
import type { DiscoveredTarget, LoadedManifest } from "#testing/index";

describe("@stackra/gen/testing", () => {
  it("exports exactly what the template imports", () => {
    expect(Object.keys(testing).sort()).toEqual([
      "discoverWithGen",
      "expectBackwardCompatible",
      "loadManifest",
      "loadOpenApi",
      "previousRelease",
      "projectOpenApi",
    ]);
  });

  it("resolves its public types", () => {
    expectTypeOf<LoadedManifest>().toExtend<StackraManifest>();
    expectTypeOf<
      NonNullable<LoadedManifest["events"][number]["broadcast"]>["audience"]
    >().toEqualTypeOf<string | undefined>();
    expectTypeOf<DiscoveredTarget["target"]>().toEqualTypeOf<string>();
    expectTypeOf(testing.loadManifest).returns.resolves.toEqualTypeOf<LoadedManifest>();
  });
});
