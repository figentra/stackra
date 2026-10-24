/**
 * Stackra file contract:
 * Purpose: proves the web EmojiPicker names the picker, its skin-tone trigger and its skin-tone list from `label`,
 *          maps the shared `size`, passes unknown props through, carries HeroUI Pro's own parts and data, and
 *          refuses HeroUI Pro's `aria-label` and a size outside sm, md and lg.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither and the popover reads them; the theme CSS is not loaded, so attributes and classes are checked, not
 *          looks. The virtualised grid draws no cells without a layout engine, so the emoji cells are not asserted.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-004
import {
  EMOJI_CATEGORIES as HERO_EMOJI_CATEGORIES,
  EMOJI_SKIN_TONES as HERO_EMOJI_SKIN_TONES,
  EmojiPicker as HeroEmojiPicker,
} from "@heroui-pro/react/emoji-picker";
import { render, screen } from "@testing-library/react";

import {
  EMOJI_CATEGORIES,
  EMOJI_SKIN_TONES,
  EmojiPicker,
  type EmojiPickerProps,
  type EmojiPickerSkinToneTriggerProps,
} from "#react/emoji-picker/emoji-picker";

// jsdom has neither `matchMedia` nor `ResizeObserver`; the config restores stubbed globals after each test.
function stubBrowserApis() {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
}
vi.hoisted(() => stubBrowserApis());

beforeEach(() => stubBrowserApis());

/** The popover's class, where the shared size shows. */
const popoverClass = () =>
  document.querySelector('[data-slot="emoji-picker-popover"]')?.className ?? "";

/** A picker with a trigger and a skin-tone control, the root's props left to the caller. */
function Example(props: Partial<EmojiPickerProps> & { readonly skinLabels?: boolean }) {
  const { skinLabels = true, ...rest } = props;
  return (
    <EmojiPicker label="Emoji" defaultValue="😀" {...rest}>
      <EmojiPicker.Trigger data-testid="trigger">
        <EmojiPicker.Value />
      </EmojiPicker.Trigger>
      <EmojiPicker.Popover>
        <EmojiPicker.Content>
          <EmojiPicker.SkinTonePicker>
            <EmojiPicker.SkinToneTrigger {...(skinLabels ? { label: "Skin tone" } : {})} />
            <EmojiPicker.SkinToneContent {...(skinLabels ? { label: "Skin tones" } : {})}>
              <EmojiPicker.SkinToneOption id="default" aria-label="Default">
                x
              </EmojiPicker.SkinToneOption>
            </EmojiPicker.SkinToneContent>
          </EmojiPicker.SkinTonePicker>
        </EmojiPicker.Content>
      </EmojiPicker.Popover>
    </EmojiPicker>
  );
}

describe("EmojiPicker (web)", () => {
  it("names the picker's select from label", () => {
    render(<Example />);
    expect(screen.getByTestId("trigger").getAttribute("aria-labelledby")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Emoji/ })).toBe(screen.getByTestId("trigger"));
  });

  it("names the skin-tone trigger from label when the popover is open", () => {
    render(<Example defaultOpen />);
    expect(screen.getByRole("button", { name: "Skin tone" })).toBeTruthy();
  });

  it("keeps HeroUI Pro's own skin-tone name without a label", () => {
    render(<Example defaultOpen skinLabels={false} />);
    expect(screen.queryByRole("button", { name: "Skin tone" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Skin tones" })).toBeNull();
  });

  it("maps the shared size onto the popover, and keeps HeroUI Pro's default without one", () => {
    const { rerender } = render(<Example defaultOpen />);
    const plain = popoverClass();
    rerender(<Example defaultOpen size="lg" />);
    const large = popoverClass();
    rerender(
      <HeroEmojiPicker.Root aria-label="Emoji" defaultOpen size="lg">
        <HeroEmojiPicker.Popover>
          <HeroEmojiPicker.Content>x</HeroEmojiPicker.Content>
        </HeroEmojiPicker.Popover>
      </HeroEmojiPicker.Root>,
    );
    expect(popoverClass()).toBe(large);
    expect(large).not.toBe(plain);
  });

  it("carries HeroUI Pro's own parts and data", () => {
    for (const part of [
      "Trigger",
      "Value",
      "Popover",
      "Content",
      "Grid",
      "Item",
      "Footer",
      "SkinTonePicker",
      "SkinToneOption",
    ] as const) {
      expect(EmojiPicker[part]).toBe(HeroEmojiPicker[part]);
    }
    expect(EMOJI_CATEGORIES).toBe(HERO_EMOJI_CATEGORIES);
    expect(EMOJI_SKIN_TONES).toBe(HERO_EMOJI_SKIN_TONES);
  });

  it("refuses HeroUI Pro's aria-label and a size outside the shared set", () => {
    expectTypeOf<EmojiPickerProps>().toHaveProperty("label");
    // `aria-label` is a hyphenated attribute, which JSX does not type-check: the type itself is asserted.
    expectTypeOf<EmojiPickerProps>().not.toHaveProperty("aria-label");
    // @ts-expect-error the shared sizes are sm, md and lg
    void (<EmojiPicker size="xl">{[]}</EmojiPicker>);
    // `aria-label` is a hyphenated attribute, which JSX does not type-check: the type itself is asserted.
    expectTypeOf<EmojiPickerSkinToneTriggerProps>().not.toHaveProperty("aria-label");
  });
});
