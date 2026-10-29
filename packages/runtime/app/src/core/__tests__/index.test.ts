/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the shared boot (`bootApp`), the `AppWiring` token and
 *          `signEdgeRequest`, `verifyBearerToken` and `jwksKeySource` are exported, nothing else is (no `createApp`, no `Module`, `Service` or `define*`), its types resolve, and
 *          `RouteSession` adds `session` and `identity` to navigation's `RouteServices`.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15); ADR 0127 2026-10-24 note; ADR 0457; ADR 0437.
 */
import type { SessionStore, SessionUser } from "@stackra/identity/contracts";
import type { RouteServices } from "@stackra/navigation";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as app from "#core/index";
import type { AppSections, BootedApp, BootOptions, RouteSession } from "#core/index";

describe("@stackra/app", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(app).sort()).toEqual([
      "AppWiring",
      "bootApp",
      "jwksKeySource",
      "signEdgeRequest",
      "verifyBearerToken",
    ]);
  });

  it("exports its types", () => {
    expectTypeOf<BootOptions["roots"]>().not.toBeNever();
    expectTypeOf<BootedApp["container"]>().not.toBeNever();
    expectTypeOf<AppSections["contexts"]>().toEqualTypeOf<readonly string[] | undefined>();
    expectTypeOf<RouteSession["session"]>().toEqualTypeOf<SessionUser | null>();
  });

  it("adds session and identity to every route context", () => {
    expectTypeOf<RouteServices["session"]>().toEqualTypeOf<SessionUser | null>();
    expectTypeOf<RouteServices["identity"]>().toEqualTypeOf<SessionStore | undefined>();
  });
});
