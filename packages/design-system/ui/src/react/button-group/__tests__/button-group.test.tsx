/**
 * Stackra file contract:
 * Purpose: proves the web ButtonGroup is a named group whose buttons keep their own names and take its disabled state.
 * Boundary: jsdom with the real HeroUI components and the kit's Button.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { Button } from "#react/button/button";
import { ButtonGroup } from "#react/button-group/button-group";

describe("ButtonGroup (web)", () => {
  it("is a named group of buttons that share the disabled state", () => {
    render(
      <ButtonGroup label="Period" isDisabled>
        <Button>Day</Button>
        <Button>Week</Button>
      </ButtonGroup>,
    );
    expect(screen.getByRole("group", { name: "Period" })).toBeTruthy();
    const week = screen.getByRole("button", { name: "Week" });
    expect(week.hasAttribute("disabled") || week.getAttribute("aria-disabled") === "true").toBe(true);
  });
});
