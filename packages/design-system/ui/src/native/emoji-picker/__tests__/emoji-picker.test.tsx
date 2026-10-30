/**
 * Stackra file contract:
 * Purpose: proves the native EmojiPicker: it is named (by its label or the catalogue), lists the recent emoji first
 *          and then each category under a header, names each emoji button by its words, narrows to the search
 *          matches, says politely when nothing matches, and picks an emoji with a light haptic.
 * Boundary: React Native does not render in vitest, so it and the house SearchField and Text are stand-ins that render
 *           plain DOM, and the haptics are recorded; what the picker reports is checked.
 * Runtime: node
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC
 *          4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { EmojiPicker } from "#native/emoji-picker/emoji-picker";

const state = vi.hoisted(() => ({ played: [] as string[] }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement(
        "div",
        { "aria-label": props["accessibilityLabel"] as string },
        props["children"] as ReactNode,
      ),
    ScrollView: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
    Pressable: (props: Record<string, unknown>) =>
      createElement(
        "button",
        { type: "button", "aria-label": props["accessibilityLabel"], onClick: props["onPress"] },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#native/search-field/search-field", async () => {
  const { createElement } = await import("react");
  return {
    SearchField: (props: Record<string, unknown>) =>
      createElement("input", {
        "aria-label": props["accessibilityLabel"] as string,
        value: props["value"] as string,
        onChange: (event: { target: { value: string } }) =>
          (props["onChange"] as (value: string) => void)(event.target.value),
      }),
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement(
        "span",
        {
          role: props["accessibilityRole"] as string,
          "aria-live": props["accessibilityLiveRegion"] as string,
        },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

const K = "ui::emoji_picker.";
const search = (text: string) =>
  fireEvent.change(screen.getByLabelText(`${K}search`), { target: { value: text } });

beforeEach(() => {
  state.played.length = 0;
});

describe("EmojiPicker (native)", () => {
  it("lists the recent emoji first, then each category under a header", () => {
    render(<EmojiPicker recent={["🦄"]} />);
    expect(screen.getByLabelText(`${K}label`)).toBeTruthy();
    const headers = screen.getAllByRole("header").map((header) => header.textContent);
    expect(headers[0]).toBe(`${K}recent`);
    expect(headers).toContain(`${K}smileys`);
    expect(screen.getByLabelText("grin smile happy").textContent).toBe("😀");
    expect(screen.getAllByText("🦄").length).toBeGreaterThan(0);
  });

  it("skips the recent row when there is none and takes its own label", () => {
    render(<EmojiPicker label="Reactions" className="wide" />);
    expect(screen.getByLabelText("Reactions")).toBeTruthy();
    expect(screen.getAllByRole("header")[0]?.textContent).not.toBe(`${K}recent`);
  });

  it("narrows to the matches and picks one with a light haptic", () => {
    const onSelect = vi.fn();
    render(<EmojiPicker onSelect={onSelect} />);
    search("grin");
    expect(screen.getAllByRole("header").map((header) => header.textContent)).toEqual([
      `${K}search`,
    ]);
    fireEvent.click(screen.getByLabelText("grin smile happy"));
    expect(onSelect).toHaveBeenCalledWith("😀");
    expect(state.played).toEqual(["light"]);
  });

  it("says politely when nothing matches, and picks without onSelect", () => {
    render(<EmojiPicker recent={["not-an-emoji"]} />);
    fireEvent.click(screen.getByLabelText("not-an-emoji"));
    expect(state.played).toEqual(["light"]);
    search("qqqqzzzz");
    expect(screen.getByText(`${K}no_matches`).getAttribute("aria-live")).toBe("polite");
  });
});
