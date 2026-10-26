/**
 * Stackra file contract:
 * Purpose: proves `useCatalogueText` answers from the provider when one is mounted and has the message, and from the
 *          package's English catalogue when no provider is above or the provider lacks the key.
 * Boundary: `@stackra/i18n/react`'s `useTranslation` is replaced by a stand-in whose behaviour each test picks; the
 *           English fallback runs the real `formatMessage` over the shipped `en/ui.json`.
 * Runtime: node
 * Governing contract: ADR 0080; ADR 0403; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// oxlint-disable-next-line no-restricted-imports -- reason: tests the shared core hook, which renders
import { renderHook } from "@testing-library/react";

import { UI_ENGLISH } from "#core/constants/ui-english.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useCatalogueText } from "#core/hooks/use-catalogue-text";

/** What the stand-in `useTranslation` does on the next render. */
const provider = vi.hoisted(() => ({ mode: "absent" as "absent" | "arabic" | "empty" }));

vi.mock("@stackra/i18n/react", () => ({
  useTranslation: () => {
    if (provider.mode === "absent")
      throw new Error("@stackra/i18n hooks need an I18nProvider above them");
    return {
      t: (key: string) => {
        if (provider.mode === "empty") throw new RangeError(`No message for "${key}"`);
        return "رجوع";
      },
    };
  },
}));

describe("useCatalogueText", () => {
  it("answers in English when no provider is mounted", () => {
    provider.mode = "absent";
    const { result } = renderHook(() => useCatalogueText(UI_ENGLISH));
    expect(result.current(UI_KEYS.ui.navigation_header.back)).toBe("Back");
    expect(result.current(UI_KEYS.ui.cursor_pagination.count, { count: 2 })).toBe(
      "Showing 2 items",
    );
  });

  it("answers from the provider when it holds the message", () => {
    provider.mode = "arabic";
    const { result } = renderHook(() => useCatalogueText(UI_ENGLISH));
    expect(result.current(UI_KEYS.ui.navigation_header.back)).toBe("رجوع");
  });

  it("falls back to English when the provider has no ui namespace", () => {
    provider.mode = "empty";
    const { result } = renderHook(() => useCatalogueText(UI_ENGLISH));
    expect(result.current(UI_KEYS.ui.filter_bar.remove, { label: "Status" })).toBe(
      "Remove filter Status",
    );
  });
});
