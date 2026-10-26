/**
 * Stackra file contract:
 * Purpose: proves the web Segment maps the shared `size` and `isDisabled`, names the control from `label`, keeps
 *          HeroUI Pro's selection props, passes unknown props through, carries HeroUI Pro's own parts, and refuses
 *          HeroUI Pro's `aria-label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `getAnimations` is stubbed because jsdom has none; the theme CSS is not loaded, so classes and names are
 *          checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-004
import { Segment as HeroSegment } from "@heroui-pro/react/segment";
import { fireEvent, render, screen } from "@testing-library/react";

import { Segment } from "#react/segment/segment";
import type { SegmentProps } from "#react/segment/segment.props";

// jsdom has no `Element.getAnimations`, which React Aria's shared-element transition calls when the selection moves.
beforeAll(() => {
  Element.prototype.getAnimations = () => [];
});

describe("Segment (web)", () => {
  it("names the control from label and draws its items", () => {
    render(
      <Segment label="View" data-testid="group" className="extra">
        <Segment.Item id="list">List</Segment.Item>
        <Segment.Separator />
        <Segment.Item id="grid">Grid</Segment.Item>
      </Segment>,
    );
    const group = screen.getByTestId("group");
    expect(group.getAttribute("aria-label")).toBe("View");
    expect(group.classList.contains("extra")).toBe(true);
    expect(screen.getAllByRole("radio").map((item) => item.textContent)).toEqual(["List", "Grid"]);
  });

  it("keeps HeroUI Pro's selection props", () => {
    const onSelectionChange = vi.fn();
    render(
      <Segment label="View" defaultSelectedKey="list" onSelectionChange={onSelectionChange}>
        <Segment.Item id="list">List</Segment.Item>
        <Segment.Item id="grid">Grid</Segment.Item>
      </Segment>,
    );
    expect(screen.getByRole("radio", { name: "List" }).getAttribute("aria-checked")).toBe("true");
    fireEvent.click(screen.getByRole("radio", { name: "Grid" }));
    expect(onSelectionChange).toHaveBeenCalledWith("grid");
  });

  it("maps isDisabled to every item, and leaves them enabled without it", () => {
    const { rerender } = render(
      <Segment isDisabled label="View">
        <Segment.Item id="list">List</Segment.Item>
      </Segment>,
    );
    expect(screen.getByRole("radio").hasAttribute("disabled")).toBe(true);
    rerender(
      <Segment label="View">
        <Segment.Item id="list">List</Segment.Item>
      </Segment>,
    );
    expect(screen.getByRole("radio").hasAttribute("disabled")).toBe(false);
  });

  it("maps the shared size, and keeps HeroUI Pro's default without one", () => {
    const { rerender } = render(
      <Segment data-testid="group">
        <Segment.Item id="a">A</Segment.Item>
      </Segment>,
    );
    const plain = screen.getByTestId("group").className;
    rerender(
      <Segment size="lg" data-testid="group">
        <Segment.Item id="a">A</Segment.Item>
      </Segment>,
    );
    const large = screen.getByTestId("group").className;
    rerender(
      <HeroSegment.Root size="lg" data-testid="group">
        <HeroSegment.Item id="a">A</HeroSegment.Item>
      </HeroSegment.Root>,
    );
    expect(screen.getByTestId("group").className).toBe(large);
    expect(large).not.toBe(plain);
  });

  it("carries HeroUI Pro's own parts", () => {
    expect(Segment.Item).toBe(HeroSegment.Item);
    expect(Segment.Separator).toBe(HeroSegment.Separator);
  });

  it("refuses HeroUI Pro's aria-label and a size outside the shared set", () => {
    expectTypeOf<SegmentProps>().toHaveProperty("label");
    expectTypeOf<SegmentProps>().toHaveProperty("size");
    // `aria-label` is a hyphenated attribute, which JSX does not type-check: the type itself is asserted.
    expectTypeOf<SegmentProps>().not.toHaveProperty("aria-label");
    // @ts-expect-error the shared sizes are sm, md and lg
    void (<Segment size="xl">{[]}</Segment>);
  });
});
