/**
 * Stackra file contract:
 * Purpose: unit tests of `parseKit`: defaults fill every block a kit leaves out, field by field; a kit's own value
 *          wins; the short name falls back to the English name; unknown top-level fields pass the schema; text that is
 *          not JSON, a missing required field and an unknown colour role are refused with their problems.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (decisions 4 and 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { KIT_DEFAULTS } from "#core/constants/kit-defaults.constant";
import { InvalidKitError } from "#core/errors/invalid-kit.error";
import { parseKit } from "#core/functions/parse-kit.function";
import { KIT } from "#core/functions/__tests__/fixtures/kit.fixture";

describe("parseKit", () => {
  it("fills the defaults", () => {
    expect(KIT.icon).toEqual(KIT_DEFAULTS.icon);
    expect(KIT.store.frames).toEqual(KIT_DEFAULTS.store.frames);
    expect(KIT.shortName).toBe("Acme");
  });

  it("keeps a kit's own values and the defaults beside them", () => {
    const kit = parseKit(
      JSON.stringify({
        id: "acme",
        name: { en: "Acme" },
        theme: "t.json",
        symbol: "s.svg",
        icon: { scale: 0.5 },
        parent: { kit: "someone-else" },
      }),
      "kit.json",
    );
    expect(kit.icon.scale).toBe(0.5);
    expect(kit.icon.background).toBe(KIT_DEFAULTS.icon.background);
  });

  it("refuses text that is not JSON", () => {
    expect(() => parseKit("{", "kit.json")).toThrow(InvalidKitError);
  });

  it("lists every schema problem", () => {
    try {
      parseKit(
        JSON.stringify({ id: "Acme", name: {}, theme: "../t.json", icon: { background: "pink" } }),
        "kit.json",
      );
      expect.unreachable();
    } catch (error) {
      expect((error as InvalidKitError).problems).toEqual(
        expect.arrayContaining([
          '$: "symbol" is required',
          '$.name: "en" is required',
          expect.stringContaining("$.id:"),
          expect.stringContaining("$.theme:"),
          expect.stringContaining("$.icon.background: must be one of"),
        ]),
      );
    }
  });
});
