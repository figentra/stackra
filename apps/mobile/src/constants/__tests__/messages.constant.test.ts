/**
 * Stackra file contract:
 * Purpose: proves `MESSAGES` holds every namespace in both locales, that every English key of the app's catalogues
 *          has its own Arabic message, and that the Arabic plurals, dates and money format.
 * Boundary: the catalogues only; no React Native module loads.
 * Runtime: node
 * Governing contract: ADR 0403 (catalogue completeness); ADR 0022 (test placement).
 */
import { formatMessage } from "@stackra/i18n";
import { describe, expect, it } from "vitest";

import arBrand from "../../../assets/lang/ar/brand.json";
import arButton from "../../../assets/lang/ar/button.json";
import arDesignSystem from "../../../assets/lang/ar/design_system.json";
import arSettings from "../../../assets/lang/ar/settings.json";
import arShell from "../../../assets/lang/ar/shell.json";
import { BUTTON_KEYS } from "../button-keys.constant";
import { DESIGN_SYSTEM_KEYS } from "../design-system-keys.constant";
import { MESSAGES } from "../messages.constant";

/** Every leaf path of a catalogue, dot-joined. */
const leaves = (node: unknown, prefix = ""): string[] =>
  typeof node === "object" && node !== null
    ? Object.entries(node).flatMap(([key, value]) => leaves(value, `${prefix}${key}.`))
    : [prefix.slice(0, -1)];

describe("MESSAGES", () => {
  it("holds every namespace in both locales", () => {
    for (const locale of ["en", "ar"] as const)
      for (const namespace of [
        "shell",
        "brand",
        "settings",
        "design_system",
        "button",
        "showcase",
        "ui",
      ])
        expect(MESSAGES[locale][namespace], `${locale} ${namespace}`).toBeDefined();
  });

  it("has every English key in the Arabic files themselves, not only through the fallback", () => {
    const arabic = {
      shell: arShell,
      brand: arBrand,
      settings: arSettings,
      design_system: arDesignSystem,
      button: arButton,
    };
    for (const [namespace, own] of Object.entries(arabic))
      expect(leaves(own), namespace).toEqual(leaves(MESSAGES.en[namespace]));
  });

  it("formats Arabic plurals, dates and money", () => {
    expect(formatMessage(MESSAGES.ar, BUTTON_KEYS.button.live.presses, { count: 2 }, "ar")).toBe(
      "ضُغط مرتين.",
    );
    const total = formatMessage(
      MESSAGES.en,
      DESIGN_SYSTEM_KEYS.design_system.showcase.filters.count,
      { count: 3, total: 1234.5 },
      "en",
    );
    expect(total).toBe("3 orders · $1,234.50");
    const released = formatMessage(
      MESSAGES.en,
      DESIGN_SYSTEM_KEYS.design_system.showcase.deploys.released,
      { version: "v1", at: new Date(2026, 9, 20) },
      "en",
    );
    expect(released).toBe("v1 · Oct 20, 2026");
  });
});
