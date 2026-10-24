/**
 * Stackra file contract:
 * Purpose: proves the Modal and Drawer contracts compose the shared overlay ones: both extend the dismissable-overlay
 *          props, the modal adds a trigger, a width, a vertical position and a label, the drawer takes only the side
 *          of the placement vocabulary, the modal's vertical place is `position` and never `placement`, and a title
 *          takes an optional level of 1 to 6.
 * Boundary: type assertions only; they are checked by the typechecker and the test passes at run time.
 * Runtime: node
 * Governing contract: ADR 0312 (decisions 1, 2 and 4); ADR 0022 (test placement).
 */
// @covers sta-350:FR-098
import type { ReactElement, ReactNode } from "react";

import type { HeadingLevel } from "#contracts/enums/heading-level.enum";
import type { Placement } from "#contracts/enums/placement.enum";
import type { Size } from "#contracts/enums/size.enum";
import type { DrawerContractProps } from "#contracts/types/drawer-contract-props.type";
import type { ModalContractProps } from "#contracts/types/modal-contract-props.type";
import type { OverlayContractProps } from "#contracts/types/overlay-contract-props.type";
import type { OverlayTitleContractProps } from "#contracts/types/overlay-title-contract-props.type";

describe("modal and drawer contracts", () => {
  it("makes both a dismissable overlay", () => {
    expectTypeOf<ModalContractProps>().toExtend<OverlayContractProps>();
    expectTypeOf<DrawerContractProps>().toExtend<OverlayContractProps>();
  });

  it("gives the modal a trigger, a width, a vertical position and a label", () => {
    expectTypeOf<ModalContractProps["children"]>().toEqualTypeOf<ReactNode>();
    expectTypeOf<ModalContractProps["trigger"]>().toEqualTypeOf<ReactElement | undefined>();
    expectTypeOf<ModalContractProps["size"]>().toEqualTypeOf<Size | "full" | undefined>();
    expectTypeOf<ModalContractProps["position"]>().toEqualTypeOf<
      "auto" | "top" | "center" | "bottom" | undefined
    >();
    expectTypeOf<ModalContractProps["label"]>().toEqualTypeOf<string | undefined>();
  });

  it("keeps the word `placement` for the drawer's side, never the modal's vertical place", () => {
    expectTypeOf<ModalContractProps>().not.toHaveProperty("placement");
    expectTypeOf<DrawerContractProps["placement"]>().toEqualTypeOf<Placement | undefined>();
    expectTypeOf<DrawerContractProps>().not.toHaveProperty("align");
  });

  it("gives the drawer a trigger and a label as well", () => {
    expectTypeOf<DrawerContractProps["trigger"]>().toEqualTypeOf<ReactElement | undefined>();
    expectTypeOf<DrawerContractProps["label"]>().toEqualTypeOf<string | undefined>();
  });

  it("takes an optional heading level for a title", () => {
    expectTypeOf<OverlayTitleContractProps["level"]>().toEqualTypeOf<HeadingLevel | undefined>();
    expectTypeOf<OverlayTitleContractProps["children"]>().toEqualTypeOf<ReactNode | undefined>();
    expectTypeOf<Record<never, never>>().toExtend<OverlayTitleContractProps>();
  });
});
