/**
 * Stackra file contract:
 * Purpose: unit tests of `PANEL_KEYS`: the keys live in the `panel` namespace, and every key exists in the shipped en and ar
 *          catalogues.
 * Boundary: test only; reads the package's own lang files.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0080 (typed i18n keys).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";

/** Every leaf key of `tree`. */
function leaves(tree: object): string[] {
  return Object.values(tree).flatMap((value) =>
    typeof value === "string" ? [value] : leaves(value as object),
  );
}

/** The catalogue of `locale`. */
function catalogue(locale: string): Record<string, unknown> {
  const path = fileURLToPath(
    new URL(`../../../../assets/lang/${locale}/panel.json`, import.meta.url),
  );
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

describe("PANEL_KEYS", () => {
  it("names keys in the panel namespace", () => {
    expect(PANEL_KEYS.panel.widgets.failed).toBe("panel::widgets.failed");
    expect(PANEL_KEYS.panel.time_range.last_7_days).toBe("panel::time_range.last_7_days");
  });

  it.each(["en", "ar"])("has every key in the %s catalogue", (locale) => {
    const messages = catalogue(locale);
    for (const key of leaves(PANEL_KEYS)) {
      const path = key.replace("panel::", "").split(".");
      const message = path.reduce<unknown>(
        (node, segment) => (node as Record<string, unknown>)?.[segment],
        messages,
      );
      expect(typeof message, key).toBe("string");
    }
  });
});
