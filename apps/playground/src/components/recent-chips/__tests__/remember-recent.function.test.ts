/**
 * Stackra file contract:
 * Purpose: proves the recent list moves a repeated path to the front, keeps only the newest six, ignores a broken
 *          store and reads empty when storage holds nonsense.
 * Boundary: jsdom's localStorage, cleared per test.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
import { readRecent } from "#src/components/recent-chips/read-recent.function";
import { RECENT_KEY } from "#src/components/recent-chips/recent-key.constant";
import { rememberRecent } from "#src/components/recent-chips/remember-recent.function";

describe("rememberRecent", () => {
  beforeEach(() => localStorage.clear());

  it("puts the newest path first, once, and keeps six", () => {
    for (const path of ["/a", "/b", "/c", "/d", "/e", "/f", "/g"]) rememberRecent(path);
    rememberRecent("/c");
    expect(readRecent()).toEqual(["/c", "/g", "/f", "/e", "/d", "/b"]);
  });

  it("reads empty when the store holds nonsense", () => {
    localStorage.setItem(RECENT_KEY, "{not json");
    expect(readRecent()).toEqual([]);
    localStorage.setItem(RECENT_KEY, JSON.stringify([1, "/ok", null]));
    expect(readRecent()).toEqual(["/ok"]);
  });
});
