/**
 * Stackra file contract:
 * Purpose: proves the web FieldError shows its message only while it is invalid: by `isInvalid` beside a plain control,
 *          by the field around it inside a HeroUI field (and a caller's `isInvalid` winning over the field), shows
 *          nothing when valid, keeps the field's own messages when it has no children, and passes id and class through.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (forms); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-092
import { TextField as HeroTextField, Input } from "@heroui/react";
import { render, screen } from "@testing-library/react";

import type { FieldErrorContractProps } from "#contracts/types/field-error-contract-props.type";
import { FieldError, type FieldErrorProps } from "#react/field-error/field-error";

describe("FieldError (web)", () => {
  it("shows its message while isInvalid is true, with HeroUI's class", () => {
    render(<FieldError isInvalid>Enter an email address.</FieldError>);
    const message = screen.getByText("Enter an email address.");
    expect(message.classList.contains("field-error")).toBe(true);
    expect(message.getAttribute("data-slot")).toBe("field-error");
  });

  it("shows nothing while isInvalid is false", () => {
    render(<FieldError isInvalid={false}>Enter an email address.</FieldError>);
    expect(screen.queryByText("Enter an email address.")).toBeNull();
  });

  it("shows nothing beside a plain control when isInvalid is left out", () => {
    render(<FieldError>Enter an email address.</FieldError>);
    expect(screen.queryByText("Enter an email address.")).toBeNull();
  });

  it("follows the field around it when isInvalid is left out", () => {
    const { rerender } = render(
      <HeroTextField isInvalid>
        <Input aria-label="Email" />
        <FieldError>Enter an email address.</FieldError>
      </HeroTextField>,
    );
    expect(screen.getByText("Enter an email address.")).toBeTruthy();
    rerender(
      <HeroTextField>
        <Input aria-label="Email" />
        <FieldError>Enter an email address.</FieldError>
      </HeroTextField>,
    );
    expect(screen.queryByText("Enter an email address.")).toBeNull();
  });

  it("ties the message to the field around it for assistive technology", () => {
    render(
      <HeroTextField isInvalid>
        <Input aria-label="Email" />
        <FieldError>Enter an email address.</FieldError>
      </HeroTextField>,
    );
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input.getAttribute("aria-describedby")).toContain(
      screen.getByText("Enter an email address.").id,
    );
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("lets a caller's isInvalid win over the field around it", () => {
    render(
      <HeroTextField>
        <Input aria-label="Email" />
        <FieldError isInvalid>Enter an email address.</FieldError>
      </HeroTextField>,
    );
    expect(screen.getByText("Enter an email address.")).toBeTruthy();
  });

  it("passes the id and class through", () => {
    render(
      <FieldError isInvalid id="email-error" className="mine">
        Enter an email address.
      </FieldError>,
    );
    const message = screen.getByText("Enter an email address.");
    expect(message.id).toBe("email-error");
    expect(message.classList.contains("mine")).toBe(true);
  });

  it("types: extends the contract", () => {
    expectTypeOf<FieldErrorProps>().toExtend<FieldErrorContractProps>();
  });
});
