/**
 * Stackra file contract:
 * Purpose: unit tests of `loadMessages`: every namespace is loaded along the locale's fallback chain and merged farthest
 *          first, a missing overlay file is skipped, and a namespace with no file on the chain is left out.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0080 (as amended by 0305 conventions 1); STA-1309.
 */
import { describe, expect, it } from "@stackra/testing";

import { loadMessages } from "#core/functions/load-messages.function";

/** A loader of `catalogue`. */
const of = (catalogue: Record<string, unknown>) => async () => ({ default: catalogue });

describe("loadMessages", () => {
  it("merges ar-SA over ar over en, per namespace", async () => {
    const messages = await loadMessages(
      {
        web: {
          en: of({ cta: { button: "Start", note: "Free" }, home: "Home" }),
          ar: of({ cta: { button: "ابدأ" } }),
          "ar-SA": of({ cta: { note: "مجاناً" } }),
        },
        loyalty_kit: { en: of({ tier: "Tier" }) },
      },
      "ar-SA",
    );
    expect(messages).toEqual({
      web: { cta: { button: "ابدأ", note: "مجاناً" }, home: "Home" },
      loyalty_kit: { tier: "Tier" },
    });
  });

  it("skips a missing overlay and leaves out a namespace with no file on the chain", async () => {
    const messages = await loadMessages(
      { web: { en: of({ home: "Home" }) }, fr_only: { fr: of({ a: "b" }) } },
      "en-US",
    );
    expect(messages).toEqual({ web: { home: "Home" } });
  });
});
