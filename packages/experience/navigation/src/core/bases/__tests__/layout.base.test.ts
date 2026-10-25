/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `Layout` kind base: bare and called forms, targets recorded and checked, the base
 *          loader answers no data, and a layout's loader receives a typed context.
 * Boundary: test only; the classes restate the template's console and web layouts.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 14, 16 and 25).
 */
import { kindOf } from "@stackra/container";
import { Target } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "vitest";

import { Layout } from "#core/bases/layout.base";
import type { LayoutClass } from "#core/types/layout-class.type";
import type { LayoutContext } from "#core/types/layout-context.type";
import type { RouteContext } from "#core/types/route-context.type";

class PublicLayout extends Layout {}

class ShellLayout extends Layout({ targets: [Target.Web, Target.Pwa, Target.Desktop] }) {
  override loader(ctx: RouteContext<this>) {
    return ctx.path === "/" ? null : ctx.redirect("/login");
  }
}

describe("Layout", () => {
  it("is written bare with no options", () => {
    expect(kindOf(PublicLayout)).toEqual({ kind: "layout", options: {} });
    expect(new PublicLayout().loader({} as never)).toBeNull();
  });

  it("records its targets when called", () => {
    expect(kindOf(ShellLayout)?.options).toEqual({ targets: ["web", "pwa", "desktop"] });
  });

  it("refuses an unknown or repeated target", () => {
    expect(() => Layout({ targets: ["moon" as Target] })).toThrow(/not a target/);
    expect(() => Layout({ targets: [Target.Web, Target.Web] })).toThrow(/once/);
  });

  it("keeps instanceof and types its context", () => {
    expect(new ShellLayout()).toBeInstanceOf(Layout);
    expectTypeOf<typeof ShellLayout>().toMatchTypeOf<LayoutClass>();
    expectTypeOf<LayoutContext<ShellLayout>>().toEqualTypeOf<RouteContext<ShellLayout>>();
  });
});
