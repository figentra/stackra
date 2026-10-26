/**
 * Stackra file contract:
 * Purpose: proves the web Button renders every variant and size as HeroUI's classes, presses once and not when
 *          disabled or loading, keeps focus while loading under an unchanged name with a hidden spinner, stretches to
 *          full width, orders its icons, takes its name from `label`, passes unknown props and the ref through, and
 *          refuses HeroUI's own names for the concepts the contract renames.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-022 sta-350:FR-024 sta-350:P-016 sta-350:FR-053
import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";

import { ButtonVariant } from "#contracts/enums/button-variant.enum";
import { Size } from "#contracts/enums/size.enum";
import type { ButtonContractProps } from "#contracts/types/button-contract-props.type";
import { Button } from "#react/button/button";
import type { ButtonProps } from "#react/button/button.props";

const press = (element: HTMLElement) => act(() => element.click());

describe("Button (web)", () => {
  it.each(ButtonVariant)("draws the %s variant in every size as HeroUI's classes", (variant) => {
    for (const size of Size) {
      const { unmount } = render(
        <Button variant={variant} size={size}>
          {variant}
        </Button>,
      );
      const button = screen.getByRole("button", { name: variant });
      expect(button.classList.contains(`button--${variant}`)).toBe(true);
      expect(button.classList.contains(`button--${size}`)).toBe(true);
      unmount();
    }
  });

  it("is a primary button of the default size when nothing is given", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" }).classList.contains("button--primary")).toBe(
      true,
    );
  });

  it("calls onPress once per press and not when disabled", () => {
    const onPress = vi.fn();
    const { rerender } = render(<Button onPress={onPress}>Save</Button>);
    press(screen.getByRole("button", { name: "Save" }));
    expect(onPress).toHaveBeenCalledOnce();
    rerender(
      <Button onPress={onPress} isDisabled>
        Save
      </Button>,
    );
    const disabled = screen.getByRole("button", { name: "Save" });
    expect((disabled as HTMLButtonElement).disabled).toBe(true);
    press(disabled);
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("refuses presses while loading, keeps focus and keeps its name, with a hidden spinner", () => {
    const onPress = vi.fn();
    render(
      <Button
        isLoading
        onPress={onPress}
        startIcon={<i data-testid="start" />}
        endIcon={<i data-testid="end" />}
      >
        Save
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Save" });
    act(() => button.focus());
    press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(button);
    expect(button.hasAttribute("data-pending")).toBe(true);
    expect(button.getAttribute("aria-disabled")).toBe("true");
    const spinner = button.querySelector('[data-slot="spinner"]');
    expect(spinner?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryByTestId("start")).toBeNull();
    expect(screen.getByTestId("end")).toBeTruthy();
  });

  it("turns a loading submit button into a plain button, which proves isPending reached React Aria", () => {
    const { rerender } = render(<Button type="submit">Save</Button>);
    expect(screen.getByRole("button").getAttribute("type")).toBe("submit");
    rerender(
      <Button type="submit" isLoading>
        Save
      </Button>,
    );
    expect(screen.getByRole("button").getAttribute("type")).toBe("button");
  });

  it("stretches to the full width only when asked", () => {
    const { rerender } = render(<Button isFullWidth>Save</Button>);
    expect(screen.getByRole("button").classList.contains("button--full-width")).toBe(true);
    rerender(<Button>Save</Button>);
    expect(screen.getByRole("button").classList.contains("button--full-width")).toBe(false);
  });

  it("draws the start icon, the label and the end icon in that order", () => {
    render(
      <Button startIcon={<i data-testid="start" />} endIcon={<i data-testid="end" />}>
        Next
      </Button>,
    );
    const nodes = [...screen.getByRole("button").childNodes];
    expect(
      nodes.map((node) => (node as HTMLElement).dataset?.["testid"] ?? node.textContent),
    ).toEqual(["start", "Next", "end"]);
  });

  it("takes its accessible name from label when one is given", () => {
    render(<Button label="Save the draft">Save</Button>);
    expect(screen.getByRole("button", { name: "Save the draft" })).toBeTruthy();
  });

  it("passes unknown props and the ref through unchanged", () => {
    const ref = createRef<HTMLButtonElement>();
    const onPressStart = vi.fn();
    render(
      <Button
        ref={ref}
        id="b"
        className="extra"
        data-testid="found"
        aria-describedby="hint"
        onPressStart={onPressStart}
      >
        Save
      </Button>,
    );
    const button = screen.getByTestId("found");
    expect(button.id).toBe("b");
    expect(button.classList.contains("extra")).toBe(true);
    expect(button.getAttribute("aria-describedby")).toBe("hint");
    expect(ref.current).toBe(button);
    act(() => {
      button.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerType: "mouse" }),
      );
    });
    expect(onPressStart).toHaveBeenCalled();
  });

  it("extends its contract and refuses HeroUI's names for what the contract renames", () => {
    expectTypeOf<ButtonProps>().toExtend<ButtonContractProps>();
    // @ts-expect-error an icon-only button is built through IconButton, which requires a label
    void (<Button isIconOnly />);
    // @ts-expect-error `isLoading` is the one name for the pending state
    void (<Button isPending />);
    // @ts-expect-error `isFullWidth` is the one name for the full-width state
    void (<Button fullWidth />);
  });

  it("draws an icon name through Icon and an element as given", () => {
    const { container } = render(
      <Button startIcon="user-round" endIcon={<i data-testid="mine" />}>
        Add
      </Button>,
    );
    expect(container.querySelector("svg.lucide-user-round")).toBeTruthy();
    expect(container.querySelector('[data-testid="mine"]')).toBeTruthy();
  });
});
