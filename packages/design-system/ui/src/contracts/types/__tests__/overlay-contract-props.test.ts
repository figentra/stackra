/**
 * Stackra file contract:
 * Purpose: proves the shared overlay contracts compose: a dismissable overlay is the open state plus the two dismissal
 *          switches, an anchored one is a side and an alignment, a message is a tone and an icon that may be `false`,
 *          and every prop of all four is optional so a component adds only what it needs.
 * Boundary: type assertions only; they are checked by the typechecker and the test passes at run time.
 * Runtime: node
 * Governing contract: ADR 0312; ADR 0022 (test placement).
 */
// @covers sta-350:FR-096
import type { Placement } from "#contracts/enums/placement.enum";
import type { PlacementAlign } from "#contracts/enums/placement-align.enum";
import type { Tone } from "#contracts/enums/tone.enum";
import type { FeedbackContractProps } from "#contracts/types/feedback-contract-props.type";
import type { IconSlot } from "#contracts/types/icon-slot.type";
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";
import type { OverlayContractProps } from "#contracts/types/overlay-contract-props.type";
import type { PlacementContractProps } from "#contracts/types/placement-contract-props.type";

describe("overlay contracts", () => {
  it("makes a dismissable overlay the open state plus two dismissal switches", () => {
    expectTypeOf<OverlayContractProps>().toExtend<OpenStateContractProps>();
    expectTypeOf<OverlayContractProps["isDismissable"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<OverlayContractProps["isKeyboardDismissDisabled"]>().toEqualTypeOf<
      boolean | undefined
    >();
  });

  it("reports the new open state", () => {
    expectTypeOf<OpenStateContractProps["onOpenChange"]>().toEqualTypeOf<
      ((isOpen: boolean) => void) | undefined
    >();
  });

  it("places an overlay by a logical side and an alignment", () => {
    expectTypeOf<PlacementContractProps["placement"]>().toEqualTypeOf<Placement | undefined>();
    expectTypeOf<PlacementContractProps["align"]>().toEqualTypeOf<PlacementAlign | undefined>();
  });

  it("types a message by tone and an icon that may be switched off", () => {
    expectTypeOf<FeedbackContractProps["tone"]>().toEqualTypeOf<Tone | undefined>();
    expectTypeOf<FeedbackContractProps["icon"]>().toEqualTypeOf<IconSlot | false | undefined>();
  });

  it("makes every prop optional", () => {
    expectTypeOf<Record<never, never>>().toExtend<OpenStateContractProps>();
    expectTypeOf<Record<never, never>>().toExtend<OverlayContractProps>();
    expectTypeOf<Record<never, never>>().toExtend<PlacementContractProps>();
    expectTypeOf<Record<never, never>>().toExtend<FeedbackContractProps>();
  });
});
