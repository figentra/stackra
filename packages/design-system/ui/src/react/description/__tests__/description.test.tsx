/**
 * Stackra file contract:
 * Purpose: proves the web Description renders its text with HeroUI's class, passes id, class and the ref through so a
 *          control can name it in `aria-describedby`, and is read out with the control it describes.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (forms); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-091
import { render, screen } from "@testing-library/react";
import { createRef } from "react";

import type { DescriptionContractProps } from "#contracts/types/description-contract-props.type";
import { Description, type DescriptionProps } from "#react/description/description";

describe("Description (web)", () => {
  it("renders its text with HeroUI's class", () => {
    render(<Description>Used only for receipts.</Description>);
    const text = screen.getByText("Used only for receipts.");
    expect(text.classList.contains("description")).toBe(true);
    expect(text.getAttribute("data-slot")).toBe("description");
  });

  it("keeps the id a control names it by in aria-describedby", () => {
    render(
      <>
        <input aria-label="Email" aria-describedby="hint" />
        <Description id="hint">Used only for receipts.</Description>
      </>,
    );
    const describedBy = screen
      .getByRole("textbox", { name: "Email" })
      .getAttribute("aria-describedby");
    expect(screen.getByText("Used only for receipts.").id).toBe(describedBy);
  });

  it("passes the class and the ref through", () => {
    const ref = createRef<HTMLElement>();
    render(
      <Description ref={ref} className="mine">
        Hint
      </Description>,
    );
    const text = screen.getByText("Hint");
    expect(text.classList.contains("mine")).toBe(true);
    expect(ref.current).toBe(text);
  });

  it("types: extends the contract", () => {
    expectTypeOf<DescriptionProps>().toExtend<DescriptionContractProps>();
  });
});
