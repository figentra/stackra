/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./ui` entry: it exports exactly the banner, the preferences, the legal page
 *          and the terms prompt.
 * Boundary: test only; `@stackra/ui/react` is replaced by stand-ins so the barrel loads without HeroUI.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as ui from "#ui/index";

vi.mock(
  "@stackra/ui/react",
  async () => (await import("#ui/__tests__/ui-stand-ins.fixture")).UI_STAND_INS,
);

describe("@stackra/consent/ui", () => {
  it("exports exactly its components", () => {
    expect(Object.keys(ui).sort()).toEqual([
      "ConsentBanner",
      "ConsentPreferences",
      "LegalPage",
      "TermsPrompt",
    ]);
  });
});
