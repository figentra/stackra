/**
 * Stackra file contract:
 * Purpose: unit tests of the theme revision functions `commitSiteTheme`, `rollbackSiteTheme` and `diffSiteTheme`: commits number
 *          from 1 and never change the history given, a commit keeps its own copy of the theme, a rollback appends the
 *          restored content marked with the revision it restores and refuses an unknown revision, and the diff names
 *          the changed section and setting keys by value.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0270 (decision 2); ADR 0359 (decision 8);
 *                     STA-1383 (renamed SiteTheme so Theme means design tokens).
 */
import { describe, expect, it } from "@stackra/testing";

import { commitSiteTheme } from "#core/functions/commit-site-theme.function";
import { diffSiteTheme } from "#core/functions/diff-site-theme.function";
import { rollbackSiteTheme } from "#core/functions/rollback-site-theme.function";
import type { SiteTheme } from "#core/types/site-theme.type";

const plain: SiteTheme = {
  sections: { header: { block: "web.header" }, footer: { block: "web.footer" } },
  settings: { accent: "#0a7", radius: 8 },
};
const holiday: SiteTheme = {
  sections: { header: { block: "web.holiday_header" }, footer: { block: "web.footer" } },
  settings: { radius: 8, accent: "#c00" },
};
const by = { author: "usr_1", at: "2026-10-25T10:00:00Z" };

describe("theme revisions", () => {
  it("commits numbered revisions without changing the history given", () => {
    const first = commitSiteTheme([], plain, by);
    const second = commitSiteTheme(first, holiday, { ...by, note: "holiday" });
    expect(first).toHaveLength(1);
    expect(second.map((revision) => revision.number)).toEqual([1, 2]);
    expect(second[1]).toMatchObject({ author: "usr_1", note: "holiday", theme: holiday });
    expect(second[0]?.theme).not.toBe(plain);
  });

  it("rolls back by appending the restored content", () => {
    const history = commitSiteTheme(commitSiteTheme([], plain, by), holiday, by);
    const rolled = rollbackSiteTheme(history, 1, by);
    expect(rolled).toHaveLength(3);
    expect(rolled[2]).toMatchObject({ number: 3, restores: 1, theme: plain });
    expect(() => rollbackSiteTheme(history, 9, by)).toThrow(RangeError);
  });

  it("names the changed section and setting keys by value", () => {
    expect(diffSiteTheme(plain, holiday)).toEqual({ sections: ["header"], settings: ["accent"] });
    expect(diffSiteTheme(plain, { ...plain, settings: { radius: 8, accent: "#0a7" } })).toEqual({
      sections: [],
      settings: [],
    });
    expect(diffSiteTheme(plain, { sections: {}, settings: plain.settings }).sections).toEqual([
      "footer",
      "header",
    ]);
  });
});
