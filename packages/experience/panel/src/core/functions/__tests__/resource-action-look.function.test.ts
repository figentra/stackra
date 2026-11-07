/**
 * Stackra file contract:
 * Purpose: unit tests of `resourceActionLook`: a spec's start icon, description, shortcut, tone, disabled state, reason
 *          and link become the menu item's fields; an empty spec gives an empty look.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); the SDUI catalogue case `rowActions` (STA-1981).
 */
import { describe, expect, it } from "@stackra/testing";

import { resourceActionLook } from "#core/functions/resource-action-look.function";

describe("resourceActionLook", () => {
  it("maps the spec onto the menu item", () => {
    expect(
      resourceActionLook({
        startIcon: "trash",
        endIcon: "chevron-right",
        variant: "danger",
        description: "Removes the order",
        shortcut: "mod+backspace",
        tone: "danger",
        isDisabled: true,
        disabledReason: "Shipped orders stay",
        href: "/orders/ord_1",
      }),
    ).toEqual({
      icon: "trash",
      description: "Removes the order",
      shortcut: "mod+backspace",
      tone: "danger",
      isDisabled: true,
      disabledReason: "Shipped orders stay",
      href: "/orders/ord_1",
    });
  });

  it("leaves out what the spec leaves out", () => {
    expect(resourceActionLook({})).toEqual({});
  });
});
