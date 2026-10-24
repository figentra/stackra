/**
 * Stackra file contract:
 * Purpose: proves `routeOverlayScreenOptions()` gives each presentation its stack options: the platform modal for
 *          `modal`, a full-screen modal for `full-screen`, and a see-through modal with the stack's own swipe off for
 *          `sheet` and `drawer`; the header is always hidden, and `isDismissable` switches the swipe-down of the two
 *          platform modals.
 * Boundary: plain functions over plain objects; React Navigation is only a type.
 * Runtime: node
 * Governing contract: ADR 0317 (decisions 8 and 9); ADR 0022 (test placement).
 */
// @covers sta-350:FR-182
import { OverlayPresentation } from "#contracts/enums/overlay-presentation.enum";
import { routeOverlayScreenOptions } from "#native/route-overlay/route-overlay-screen-options";

describe("routeOverlayScreenOptions", () => {
  it("presents a modal as the platform's modal card, with the swipe-down on", () => {
    expect(routeOverlayScreenOptions("modal")).toEqual({
      presentation: "modal",
      headerShown: false,
      gestureEnabled: true,
    });
  });

  it("presents full-screen as a full-screen modal", () => {
    expect(routeOverlayScreenOptions("full-screen")).toMatchObject({
      presentation: "fullScreenModal",
      headerShown: false,
    });
  });

  it("turns the swipe-down off for a modal or a full-screen page that is not dismissable", () => {
    for (const presentation of ["modal", "full-screen"] as const)
      expect(routeOverlayScreenOptions(presentation, { isDismissable: false })).toMatchObject({
        gestureEnabled: false,
      });
  });

  it.each(["sheet", "drawer"] as const)(
    "presents %s as a see-through modal that the bottom sheet fills",
    (presentation) => {
      expect(routeOverlayScreenOptions(presentation)).toEqual({
        presentation: "transparentModal",
        animation: "fade",
        headerShown: false,
        gestureEnabled: false,
        contentStyle: { backgroundColor: "transparent" },
      });
    },
  );

  it("hides the header for every presentation, because the overlay draws its own", () => {
    for (const presentation of OverlayPresentation)
      expect(routeOverlayScreenOptions(presentation).headerShown).toBe(false);
  });
});
