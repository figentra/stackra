/**
 * Stackra file contract:
 * Purpose: proves the web SplitButton is a group of the primary button and a caret named by `menuLabel`, runs the
 *          primary action on press, opens the related actions from the caret and reports the chosen key, turns the
 *          caret while open, refuses both halves when disabled and the caret while loading, and passes group props on.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";

import type { MenuSection } from "#contracts/types/menu-section.type";
import type { SplitButtonContractProps } from "#contracts/types/split-button-contract-props.type";
import { SplitButton } from "#react/split-button/split-button";
import type { SplitButtonProps } from "#react/split-button/split-button.props";

const press = (element: HTMLElement) => act(() => element.click());

const SECTIONS: readonly MenuSection[] = [
  {
    id: "save",
    title: "Save options",
    isTitleHidden: true,
    items: [
      { id: "save-new", label: "Save and new" },
      { id: "save-draft", label: "Save as draft" },
    ],
  },
];

// `hidden`: an open menu hides the page behind it from assistive technology, the caret included.
const caret = () =>
  screen.getByRole<HTMLButtonElement>("button", { name: "More save options", hidden: true });

describe("SplitButton (web)", () => {
  it("groups the primary button with a caret named by menuLabel, and runs the primary action", () => {
    const onPress = vi.fn();
    render(
      <SplitButton menuLabel="More save options" sections={SECTIONS} onPress={onPress}>
        Save
      </SplitButton>,
    );
    const group = screen.getByRole("group");
    const save = screen.getByRole("button", { name: "Save" });
    expect(group.contains(save) && group.contains(caret())).toBe(true);
    expect(save.classList.contains("button--primary")).toBe(true);
    press(save);
    expect(onPress).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens the related actions from the caret, turns the caret and reports the chosen key", () => {
    const onAction = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <SplitButton
        menuLabel="More save options"
        sections={SECTIONS}
        onAction={onAction}
        onOpenChange={onOpenChange}
      >
        Save
      </SplitButton>,
    );
    expect(caret().querySelector("svg")?.classList.contains("rotate-180")).toBe(false);
    press(caret());
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(caret().querySelector("svg")?.classList.contains("rotate-180")).toBe(true);
    press(screen.getByRole("menuitem", { name: "Save and new" }));
    expect(onAction).toHaveBeenCalledWith("save-new");
  });

  it("refuses both halves when disabled, and the caret while loading", () => {
    const { rerender } = render(
      <SplitButton menuLabel="More save options" sections={SECTIONS} isDisabled>
        Save
      </SplitButton>,
    );
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Save" }).disabled).toBe(true);
    expect(caret().disabled).toBe(true);
    rerender(
      <SplitButton menuLabel="More save options" sections={SECTIONS} isLoading>
        Save
      </SplitButton>,
    );
    expect(caret().disabled).toBe(true);
    press(caret());
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("hands both halves the variant and size, and passes group props through", () => {
    render(
      <SplitButton
        menuLabel="More save options"
        sections={SECTIONS}
        variant="secondary"
        size="sm"
        aria-label="Save"
        id="split"
      >
        Save
      </SplitButton>,
    );
    expect(screen.getByRole("group").id).toBe("split");
    for (const button of screen.getAllByRole("button")) {
      expect(button.classList.contains("button--secondary")).toBe(true);
      expect(button.classList.contains("button--sm")).toBe(true);
    }
  });

  it("types: extends the contract and needs a menu label and sections", () => {
    expectTypeOf<SplitButtonProps>().toExtend<SplitButtonContractProps>();
    // @ts-expect-error the caret needs a name and the menu its actions
    const missing: SplitButtonProps = { children: "Save" };
    expect(missing).toBeTruthy();
  });
});
