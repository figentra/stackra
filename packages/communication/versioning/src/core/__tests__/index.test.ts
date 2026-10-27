/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: `Change`, the one symbol the template imports, and the registry
 *          row's runtime (`registerChanges`, `downgrade`, `upgrade`, `resolveVersion`, `applyVersionHeaders`, the
 *          headers, the support window default and the two refusals) are exported, nothing else is, the internals
 *          are not, and the public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as versioning from "#core/index";
import type {
  ChangeBase,
  ChangeClass,
  ChangeOptions,
  EventChangeBase,
  ResolvedVersion,
  VersionRequest,
} from "#core/index";

describe("@stackra/versioning", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(versioning).sort()).toEqual([
      "Change",
      "UnsupportedVersionError",
      "VERSIONING_HEADERS",
      "VERSION_SUPPORT_MONTHS",
      "VersionSunsetError",
      "applyVersionHeaders",
      "downgrade",
      "registerChanges",
      "resolveVersion",
      "upgrade",
    ]);
    expect("isCalendarDate" in versioning).toBe(false);
    expect("CHANGE_REGISTRY" in versioning).toBe(false);
  });

  it("resolves its public types", () => {
    expectTypeOf<ChangeOptions<number>["from"]>().toEqualTypeOf<number>();
    expectTypeOf<ChangeOptions["sunset"]>().toEqualTypeOf<string>();
    expectTypeOf<ChangeBase<object>["down"]>().returns.toEqualTypeOf<ChangeBase<object>>();
    expectTypeOf<EventChangeBase<never>>().toHaveProperty("up");
    expectTypeOf<InstanceType<ChangeClass>>().toEqualTypeOf<ChangeBase<object>>();
    expectTypeOf<ResolvedVersion["version"]>().toEqualTypeOf<string>();
    expectTypeOf<VersionRequest["supportMonths"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<VersionRequest["header"]>().toEqualTypeOf<string | null | undefined>();
  });
});
