/**
 * Stackra file contract:
 * Purpose: proves the contracts of @stackra/navigation: `OverlayPresentation` is exactly modal, sheet, drawer and
 *          full-screen; a route overlay's props require a title and a close label and carry no open state (the route
 *          is the open state); the controls hold close, complete, setDismissable and isDismissable; and the leave
 *          confirmation's props are LeaveConfirmation's without its `ref`.
 * Boundary: types and one frozen tuple; nothing renders.
 * Runtime: node
 * Governing contract: ADR 0317 (decisions 2 and 9); ADR 0022 (test placement).
 */
// @covers sta-350:FR-178
import type { LeaveConfirmationContractProps } from "@stackra/ui/contracts";

import { OverlayPresentation } from "#contracts/enums/overlay-presentation.enum";
import type { RouteLeaveConfirmationContractProps } from "#contracts/types/route-leave-confirmation-contract-props.type";
import type { RouteOverlayContractProps } from "#contracts/types/route-overlay-contract-props.type";
import type { RouteOverlayControls } from "#contracts/types/route-overlay-controls.type";
import type { RouteOverlayState } from "#contracts/types/route-overlay-state.type";

describe("@stackra/navigation contracts", () => {
  it("names the four presentations, frozen", () => {
    expect([...OverlayPresentation]).toEqual(["modal", "sheet", "drawer", "full-screen"]);
    expect(Object.isFrozen(OverlayPresentation)).toBe(true);
    expectTypeOf<OverlayPresentation>().toEqualTypeOf<
      "modal" | "sheet" | "drawer" | "full-screen"
    >();
  });

  it("requires a title and a close label on a route overlay and gives it no open state", () => {
    expectTypeOf<RouteOverlayContractProps["title"]>().not.toBeUndefined();
    expectTypeOf<RouteOverlayContractProps["closeLabel"]>().toEqualTypeOf<string>();
    expectTypeOf<RouteOverlayContractProps>().not.toHaveProperty("isOpen");
    expectTypeOf<RouteOverlayContractProps>().not.toHaveProperty("onOpenChange");
    expectTypeOf<RouteOverlayContractProps["presentation"]>().toEqualTypeOf<
      OverlayPresentation | undefined
    >();
    expectTypeOf<RouteOverlayContractProps["size"]>().toEqualTypeOf<
      "sm" | "md" | "lg" | undefined
    >();
  });

  it("holds the four controls of the overlay a page sits in", () => {
    expectTypeOf<RouteOverlayControls>().toHaveProperty("close");
    expectTypeOf<RouteOverlayControls["complete"]>().toEqualTypeOf<(to?: string) => void>();
    expectTypeOf<RouteOverlayControls["setDismissable"]>().toEqualTypeOf<
      (isDismissable: boolean) => void
    >();
    expectTypeOf<RouteOverlayControls["isDismissable"]>().toEqualTypeOf<boolean>();
  });

  it("reads one optional returnTo from the history state", () => {
    expectTypeOf<RouteOverlayState["returnTo"]>().toEqualTypeOf<string | undefined>();
  });

  it("takes LeaveConfirmation's props without its ref", () => {
    expectTypeOf<RouteLeaveConfirmationContractProps>().not.toHaveProperty("ref");
    expectTypeOf<RouteLeaveConfirmationContractProps>().toEqualTypeOf<
      Omit<LeaveConfirmationContractProps, "ref">
    >();
  });
});
