/**
 * Stackra file contract:
 * Purpose: proves `useUiProText` answers the package's own keys in English when no `I18nProvider` is mounted, ICU
 *          placeholders included, and that every key in `UI_PRO_KEYS` has an English message.
 * Boundary: renders the hook with no provider; the provider path is `@stackra/ui`'s `useCatalogueText`, tested there.
 * Runtime: node
 * Governing contract: ADR 0080; ADR 0403; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// oxlint-disable-next-line no-restricted-imports -- reason: tests the shared core hook, which renders
import { renderHook } from "@testing-library/react";

import { UI_PRO_KEYS } from "#core/constants/ui-pro-keys.constant";
import { useUiProText } from "#core/hooks/use-ui-pro-text";

/** Every leaf key of a keys tree. */
const leaves = (tree: unknown): string[] =>
  typeof tree === "string" ? [tree] : Object.values(tree as object).flatMap(leaves);

describe("useUiProText", () => {
  it("answers in English without a provider", () => {
    const { result } = renderHook(() => useUiProText());
    expect(result.current(UI_PRO_KEYS.ui_pro.code_block.copy)).toBe("Copy code");
    expect(result.current(UI_PRO_KEYS.ui_pro.chat.remove_attachment, { name: "a.pdf" })).toBe(
      "Remove a.pdf",
    );
  });

  it("has an English message for every key", () => {
    const { result } = renderHook(() => useUiProText());
    // any placeholder a message names gets a value, so only a missing message can throw
    const values = new Proxy({}, { get: () => "x", has: () => true });
    for (const key of leaves(UI_PRO_KEYS))
      expect(() => result.current(key as never, values)).not.toThrow();
  });
});
