/**
 * Stackra file contract:
 * Purpose: proves the native CheckboxButtonGroup and its cards: a list named by a text label of checkbox cards, each
 *          named by its label and hinted by its line; a press plays a selection haptic and toggles the card in or out
 *          (kept when uncontrolled); read-only ignores presses; disabled cards and items cannot be pressed; a row lays
 *          the cards side by side; the help shows and the error only when invalid; a radio card marks with a dot.
 * Boundary: React Native does not render in vitest, so it and the house Text, Icon and haptics are recording
 *           stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC
 *          4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { CheckboxButtonGroup } from "#native/checkbox-button-group/checkbox-button-group";
import { ChoiceCard } from "#native/checkbox-button-group/choice-card";

const state = vi.hoisted(() => ({
  views: [] as Record<string, unknown>[],
  cards: [] as Record<string, unknown>[],
  played: [] as string[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
    Pressable: (props: Record<string, unknown>) => {
      state.cards.push(props);
      return createElement(
        "button",
        {
          type: "button",
          "aria-label": props["accessibilityLabel"] as string,
          onClick: props["onPress"] as () => void,
        },
        props["children"] as ReactNode,
      );
    },
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});
vi.mock("#native/icon/icon", async () => {
  const { createElement } = await import("react");
  return {
    Icon: (props: Record<string, unknown>) =>
      createElement("i", { "data-testid": `icon:${String(props["name"])}` }),
  };
});
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));

const ITEMS = [
  { id: "a", label: "Email", description: "Daily digest", icon: "mail" as const },
  { id: "b", label: "SMS" },
  { id: "c", label: "Fax", isDisabled: true },
];
const checked = () =>
  state.cards
    .slice(-ITEMS.length)
    .map((card) => (card["accessibilityState"] as { checked: boolean }).checked);
const press = (label: string) => fireEvent.click(screen.getByLabelText(label));

beforeEach(() => {
  state.views.length = 0;
  state.cards.length = 0;
  state.played.length = 0;
});

describe("CheckboxButtonGroup (native)", () => {
  it("is a named list of checkbox cards with their hints and states", () => {
    render(<CheckboxButtonGroup items={ITEMS} label="Channels" description="Pick any" />);
    expect(state.views.find((view) => view["accessibilityRole"] === "list")).toMatchObject({
      accessibilityLabel: "Channels",
      className: "gap-2 ",
    });
    expect(
      state.cards.map((card) => [
        card["accessibilityRole"],
        card["accessibilityHint"],
        card["disabled"],
      ]),
    ).toEqual([
      ["checkbox", "Daily digest", false],
      ["checkbox", undefined, false],
      ["checkbox", undefined, true],
    ]);
    expect(screen.getByTestId("icon:mail")).toBeTruthy();
    expect(screen.getByText("Pick any")).toBeTruthy();
  });

  it("toggles a card in and out with a haptic and reports the keys", () => {
    const onChange = vi.fn();
    render(<CheckboxButtonGroup items={ITEMS} onChange={onChange} />);
    press("Email");
    press("SMS");
    expect(onChange).toHaveBeenLastCalledWith(["a", "b"]);
    expect(checked()).toEqual([true, true, false]);
    expect(screen.getAllByTestId("icon:check")).toHaveLength(2);
    press("Email");
    expect(onChange).toHaveBeenLastCalledWith(["b"]);
    expect(state.played).toHaveLength(3);
  });

  it("keeps the owner's keys, lays a row and shows the error when invalid", () => {
    const onChange = vi.fn();
    render(
      <CheckboxButtonGroup
        items={ITEMS}
        value={["b"]}
        onChange={onChange}
        orientation="horizontal"
        label={<b>Rich</b>}
        isInvalid
        errorMessage="Pick one"
      />,
    );
    press("Email");
    expect(onChange).toHaveBeenCalledWith(["b", "a"]);
    expect(checked()).toEqual([false, true, false]);
    expect(String(state.cards[0]?.["className"])).toContain("flex-1");
    expect(state.views.find((view) => view["accessibilityRole"] === "list")).not.toHaveProperty(
      "accessibilityLabel",
    );
    expect(screen.getByText("Pick one")).toBeTruthy();
  });

  it("ignores presses while read-only and disables every card while disabled", () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <CheckboxButtonGroup
        items={ITEMS}
        defaultValue={["a"]}
        onChange={onChange}
        isReadOnly
        errorMessage="x"
      />,
    );
    press("SMS");
    expect(onChange).not.toHaveBeenCalled();
    expect(checked()).toEqual([true, false, false]);
    expect(screen.queryByText("x")).toBeNull();
    unmount();
    state.cards.length = 0;
    render(<CheckboxButtonGroup items={ITEMS} isDisabled />);
    expect(state.cards.every((card) => card["disabled"] === true)).toBe(true);
  });

  it("marks a chosen radio card with a dot", () => {
    render(
      <ChoiceCard
        item={{ id: "b", label: "SMS" }}
        isSelected
        mark="radio"
        isDisabled={false}
        onPress={() => undefined}
        isWide={false}
      />,
    );
    expect(state.cards[0]?.["accessibilityRole"]).toBe("radio");
    expect(
      state.views.some((view) => String(view["className"]).includes("bg-accent-foreground")),
    ).toBe(true);
  });
});
