/**
 * Stackra file contract:
 * Purpose: proves the web Label is a `label` element tied to its control by `htmlFor`, draws the required, invalid and
 *          disabled states as HeroUI's classes only when asked, takes them from nothing else, and passes class, id and
 *          the ref through.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (forms); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-090
import { render, screen } from "@testing-library/react";
import { createRef } from "react";

import type { LabelContractProps } from "#contracts/types/label-contract-props.type";
import { Label, type LabelProps } from "#react/label/label";

describe("Label (web)", () => {
  it("names the control it is tied to by htmlFor", () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <input id="email" />
      </>,
    );
    expect(screen.getByLabelText("Email").id).toBe("email");
    expect(screen.getByText("Email").tagName).toBe("LABEL");
  });

  it("draws no state by default", () => {
    render(<Label>Email</Label>);
    const label = screen.getByText("Email");
    expect(label.classList.contains("label")).toBe(true);
    for (const state of ["required", "invalid", "disabled"])
      expect(label.classList.contains(`label--${state}`)).toBe(false);
  });

  it.each(["isRequired", "isInvalid", "isDisabled"] as const)(
    "draws %s as HeroUI's class",
    (flag) => {
      render(<Label {...{ [flag]: true }}>Email</Label>);
      const state = flag.slice(2).toLowerCase();
      expect(screen.getByText("Email").classList.contains(`label--${state}`)).toBe(true);
    },
  );

  it("leaves a state it was not given to HeroUI's default", () => {
    render(
      <Label isRequired={undefined} isInvalid={false}>
        Email
      </Label>,
    );
    const label = screen.getByText("Email");
    expect(label.classList.contains("label--required")).toBe(false);
    expect(label.classList.contains("label--invalid")).toBe(false);
  });

  it("passes the id, class and the ref through", () => {
    const ref = createRef<HTMLLabelElement>();
    render(
      <Label ref={ref} id="l" className="mine">
        Email
      </Label>,
    );
    const label = screen.getByText("Email");
    expect(label.id).toBe("l");
    expect(label.classList.contains("mine")).toBe(true);
    expect(ref.current).toBe(label);
  });

  it("types: extends the contract", () => {
    expectTypeOf<LabelProps>().toExtend<LabelContractProps>();
  });
});
