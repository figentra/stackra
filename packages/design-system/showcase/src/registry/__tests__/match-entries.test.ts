/**
 * Stackra file contract:
 * Purpose: the one search rule: every word must match, title beats keyword beats prop, the hit says why, and the
 *          locale and platform filters apply.
 * Boundary: pure function over fixture rows.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.5.
 */
import { describe, expect, it } from "vitest";

import { matchEntries } from "#src/registry/match-entries.function";
import type { SearchDoc } from "#src/types/search-doc.type";

/** A search row with defaults. */
function doc(overrides: Partial<SearchDoc>): SearchDoc {
  return {
    key: "free/button",
    tier: "free",
    category: "actions",
    platforms: ["react", "native"],
    lang: "en",
    title: "Button",
    description: "Triggers an action or an event.",
    keywords: ["press"],
    headings: ["Variants"],
    propNames: ["isLoading", "variant"],
    ...overrides,
  };
}

const BUTTON = doc({});
const SLIDE = doc({
  key: "pro/slide-button",
  tier: "pro",
  platforms: ["native"],
  title: "Slide button",
  propNames: ["isLoading"],
});
const TABS = doc({
  key: "free/tabs",
  category: "navigation",
  title: "Tabs",
  keywords: ["segments"],
  propNames: ["selectedKey", "orientation"],
});
const ARABIC = doc({ lang: "ar", title: "Button", description: "يشغّل إجراءً أو حدثًا." });

describe("matchEntries", () => {
  it("matches a prop name and says so", () => {
    const hits = matchEntries([BUTTON, TABS], "isloading");
    expect(hits.map((hit) => hit.doc.key)).toEqual(["free/button"]);
    expect(hits[0]).toMatchObject({ reason: "prop", matched: "isLoading" });
  });

  it("ranks a title hit above a prop hit and requires every word", () => {
    const hits = matchEntries([SLIDE, BUTTON], "button");
    expect(hits[0]?.doc.key).toBe("free/button");
    expect(matchEntries([BUTTON], "button tabs")).toEqual([]);
    expect(matchEntries([BUTTON], "   ")).toEqual([]);
  });

  it("ranks the title the query names whole above a longer title that starts with it", () => {
    const field = doc({ key: "free/button-field", title: "Button field" });
    expect(matchEntries([field, BUTTON], "button").map((hit) => hit.doc.key)).toEqual([
      "free/button",
      "free/button-field",
    ]);
    expect(matchEntries([BUTTON, field], "button field")[0]?.doc.key).toBe("free/button-field");
    // A prefix of both titles ties on score; the shorter title, which the query covers more of, comes first.
    expect(matchEntries([field, BUTTON], "butt").map((hit) => hit.doc.key)).toEqual([
      "free/button",
      "free/button-field",
    ]);
  });

  it("filters by platform, locale and limit", () => {
    expect(matchEntries([BUTTON, SLIDE], "isloading", { platform: "react" })).toHaveLength(1);
    expect(matchEntries([BUTTON, ARABIC], "حدث", { lang: "ar" })[0]?.reason).toBe("description");
    expect(matchEntries([BUTTON, SLIDE], "isloading", { limit: 1 })).toHaveLength(1);
  });
});
