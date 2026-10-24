/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the shared boot (`bootApp`) and the `AppWiring` token are
 *          exported, nothing else is (no `createApp`, no `Module`, `Service` or `define*`), and its types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15); ADR 0127 2026-10-24 note.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as app from "#core/index";
import type { AppSections, BootedApp, BootOptions } from "#core/index";

describe("@stackra/app", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(app).sort()).toEqual(["AppWiring", "bootApp"]);
  });

  it("exports its types", () => {
    expectTypeOf<BootOptions["roots"]>().not.toBeNever();
    expectTypeOf<BootedApp["container"]>().not.toBeNever();
    expectTypeOf<AppSections["contexts"]>().toEqualTypeOf<readonly string[] | undefined>();
  });
});
