/**
 * Stackra file contract:
 * Purpose: proves `searchDocs` words every entry from the catalogue and that `matchEntries` finds Button by a keyword
 *          over the result.
 * Boundary: the registry and the English catalogue; no React Native module loads.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.5; ADR 0022 (test placement).
 */
import { formatMessage, type I18nKey } from "@stackra/i18n";
import { COMPONENTS, matchEntries } from "@stackra/showcase";
import { describe, expect, it } from "vitest";

import { MESSAGES } from "#src/constants/messages.constant";
import { searchDocs } from "../search-docs.function";

const english = (key: I18nKey) => formatMessage(MESSAGES.en, key, undefined, "en");

describe("searchDocs", () => {
  it("words one doc per entry from the catalogue", () => {
    const docs = searchDocs(english, "en");
    expect(docs).toHaveLength(COMPONENTS.length);
    const button = docs.find((doc) => doc.key === "free/button");
    expect(button?.title).toBe("Button");
    expect(button?.keywords).toContain("cta");
    expect(button?.headings.length).toBeGreaterThan(0);
  });

  it("finds Button by a keyword through matchEntries", () => {
    const hits = matchEntries(searchDocs(english, "en"), "cta");
    expect(hits[0]?.doc.key).toBe("free/button");
    expect(hits[0]?.reason).toBe("keyword");
  });
});
