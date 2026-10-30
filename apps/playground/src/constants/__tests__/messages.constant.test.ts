/**
 * Stackra file contract:
 * Purpose: proves `MESSAGES` holds every app namespace and the ui ones in both locales, that every English key of the
 *          app's catalogues has an Arabic message, and that the Arabic messages format (plurals included).
 * Boundary: the catalogues only; no React.
 * Runtime: browser
 * Governing contract: ADR 0403 (catalogue completeness); ADR 0022 (test placement).
 */
import { formatMessage } from "@stackra/i18n";

import { MESSAGES } from "#src/constants/messages.constant";
import { BUTTON_KEYS } from "#src/routes/button/button-keys.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";

/** Every leaf path of a catalogue, dot-joined. */
const leaves = (node: unknown, prefix = ""): string[] =>
  typeof node === "object" && node !== null
    ? Object.entries(node).flatMap(([key, value]) => leaves(value, `${prefix}${key}.`))
    : [prefix.slice(0, -1)];

describe("MESSAGES", () => {
  it("holds the app's namespaces and @stackra/ui's in both locales", () => {
    for (const locale of ["en", "ar"] as const)
      for (const namespace of ["shell", "palette", "button", "tabs", "ui", "showcase"])
        expect(MESSAGES[locale][namespace], `${locale} ${namespace}`).toBeDefined();
  });

  it("has an Arabic message, not the English fallback, for every app key", () => {
    for (const namespace of ["shell", "palette", "button", "tabs"]) {
      const english = MESSAGES.en[namespace];
      const arabic = MESSAGES.ar[namespace];
      for (const path of leaves(english)) {
        const at = (catalogue: unknown) =>
          path
            .split(".")
            .reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], catalogue);
        expect(at(arabic), `${namespace}::${path}`).not.toBe(at(english));
      }
    }
  });

  it("formats Arabic plurals", () => {
    expect(formatMessage(MESSAGES.ar, BUTTON_KEYS.button.live.presses, { count: 2 }, "ar")).toBe(
      "ضُغط مرتين.",
    );
    expect(formatMessage(MESSAGES.en, BUTTON_KEYS.button.live.presses, { count: 1 }, "en")).toBe(
      "Pressed 1 time.",
    );
    expect(
      formatMessage(MESSAGES.ar, SHOWCASE_KEYS.showcase.ui.count_components, { count: 2 }, "ar"),
    ).toBe("مكونان");
  });
});
