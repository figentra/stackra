/**
 * Stackra file contract:
 * Purpose: proves the palette's search docs carry each entry's catalogue title, description, keywords (registry and
 *          catalogue ones) and example headings, in English and in Arabic, and that the registry's matcher finds a
 *          component by a keyword through them.
 * Boundary: the real registry and catalogues; no DOM.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
import { bySlug, matchEntries } from "@stackra/showcase";

import { searchDocs } from "#src/components/command-palette/search-docs.function";
import { MESSAGES } from "#src/constants/messages.constant";

describe("searchDocs", () => {
  const button = bySlug("free", "button");
  if (!button) throw new Error("free/button is not registered");

  it("builds one doc per entry from the catalogue", () => {
    const [doc] = searchDocs(MESSAGES.en, "en", [button]);
    expect(doc?.key).toBe("free/button");
    expect(doc?.title).toBe("Button");
    expect(doc?.description.length).toBeGreaterThan(0);
    expect(doc?.keywords).toContain("press");
    expect(doc?.headings.length).toBe(button.examples.length);
  });

  it("reads Arabic keywords from the Arabic catalogue", () => {
    const [doc] = searchDocs(MESSAGES.ar, "ar", [button]);
    expect(doc?.lang).toBe("ar");
    expect(doc?.keywords).toContain("ضغط");
  });

  it("is what the matcher searches", () => {
    const hits = matchEntries(searchDocs(MESSAGES.en, "en"), "press");
    expect(hits.map((hit) => hit.doc.key)).toContain("free/button");
  });
});
