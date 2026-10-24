/**
 * Stackra file contract:
 * Purpose: proves the shared wave 6 shell contracts compose: a navigation item is a keyed, labelled place that nests,
 *          a landmark takes only a name, the bar slots and the title block are nodes, the breakpoint is one of four
 *          Tailwind names, and every prop but a title and an item's key and label is optional.
 * Boundary: type assertions and one tuple check; the assertions are checked by the typechecker.
 * Runtime: node
 * Governing contract: ADR 0314; ADR 0022 (test placement).
 */
// @covers sta-350:FR-152
import type { ReactNode } from "react";

import { LayoutBreakpoint } from "#contracts/enums/layout-breakpoint.enum";
import type { HeadingLevel } from "#contracts/enums/heading-level.enum";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { IconSlot } from "#contracts/types/icon-slot.type";
import type { LandmarkContractProps } from "#contracts/types/landmark-contract-props.type";
import type { LayoutBreakpointContractProps } from "#contracts/types/layout-breakpoint-contract-props.type";
import type { NavigationItem } from "#contracts/types/navigation-item.type";
import type { ShellSlotsContractProps } from "#contracts/types/shell-slots-contract-props.type";
import type { TitledContractProps } from "#contracts/types/titled-contract-props.type";

describe("shell contracts", () => {
  it("makes a navigation item a collection item with a label", () => {
    expectTypeOf<NavigationItem>().toExtend<CollectionItem>();
    expectTypeOf<NavigationItem["label"]>().toEqualTypeOf<string>();
    expectTypeOf<{ readonly id: string; readonly label: string }>().toExtend<NavigationItem>();
  });

  it("lets a navigation item lead somewhere, carry a badge and nest further items", () => {
    expectTypeOf<NavigationItem["href"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<NavigationItem["icon"]>().toEqualTypeOf<IconSlot | undefined>();
    expectTypeOf<NavigationItem["isCurrent"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<NavigationItem["badge"]>().toEqualTypeOf<string | number | undefined>();
    expectTypeOf<NavigationItem["children"]>().toEqualTypeOf<
      readonly NavigationItem[] | undefined
    >();
  });

  it("gives a landmark a name and nothing else", () => {
    expectTypeOf<LandmarkContractProps["label"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<keyof LandmarkContractProps>().toEqualTypeOf<"label">();
  });

  it("offers a start and an end slot of nodes", () => {
    expectTypeOf<ShellSlotsContractProps["startContent"]>().toEqualTypeOf<ReactNode | undefined>();
    expectTypeOf<ShellSlotsContractProps["endContent"]>().toEqualTypeOf<ReactNode | undefined>();
    expectTypeOf<Record<never, never>>().toExtend<ShellSlotsContractProps>();
  });

  it("requires a title and leaves its description and level optional", () => {
    expectTypeOf<TitledContractProps["title"]>().toEqualTypeOf<ReactNode>();
    expectTypeOf<TitledContractProps["headingLevel"]>().toEqualTypeOf<HeadingLevel | undefined>();
    expectTypeOf<{ readonly title: ReactNode }>().toExtend<TitledContractProps>();
  });

  it("collapses below one of four breakpoints", () => {
    expect(LayoutBreakpoint).toEqual(["sm", "md", "lg", "xl"]);
    expectTypeOf<LayoutBreakpointContractProps["collapseBelow"]>().toEqualTypeOf<
      LayoutBreakpoint | undefined
    >();
  });
});
