/**
 * Stackra file contract:
 * Purpose: unit tests of `indexableItems`, the phone's search visibility rules: only the signed-in person's own,
 *          listed, non-sensitive, recent records with a link, newest first and capped; nothing when off or signed out.
 * Boundary: test only; a fixed clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0333; ADR 0478.
 */
import { describe, expect, it } from "@stackra/testing";

import { NOW } from "#core/__tests__/now.fixture";
import { record } from "#core/__tests__/record.fixture";
import { USER } from "#core/__tests__/user.fixture";
import { indexableItems } from "#core/functions/indexable-items.function";

/** Rules that list the customer kind. */
const RULES = { isEnabled: true, kinds: ["crm.customer"], maxItems: 50, maxAgeDays: 30 };

describe("indexableItems", () => {
  it("turns an allowed record into an entry without its owner, flag or date", () => {
    expect(indexableItems(RULES, USER, [record()], NOW)).toEqual([
      {
        url: "figentra://crm/customers/cus_1",
        kind: "crm.customer",
        title: "Sara Al-Harbi",
        description: "Riyadh",
        keywords: ["vip"],
      },
    ]);
  });

  it("leaves out another person's, sensitive, unlisted, old, undated and linkless records", () => {
    const records = [
      record({ ownerId: "usr_other" }),
      record({ isSensitive: true }),
      record({ kind: "hr.payslip" }),
      record({ updatedAt: "2026-09-01T00:00:00.000Z" }),
      record({ updatedAt: "not a date" }),
      record({ url: "" }),
    ];
    expect(indexableItems(RULES, USER, records, NOW)).toEqual([]);
  });

  it("indexes nothing when off, signed out or with no kinds listed", () => {
    expect(indexableItems({ ...RULES, isEnabled: false }, USER, [record()], NOW)).toEqual([]);
    expect(indexableItems(RULES, null, [record()], NOW)).toEqual([]);
    expect(indexableItems({ ...RULES, kinds: [] }, USER, [record()], NOW)).toEqual([]);
  });

  it("keeps the newest maxItems", () => {
    const records = [
      record({ url: "figentra://a", updatedAt: "2026-10-27T00:00:00.000Z" }),
      record({ url: "figentra://b", updatedAt: "2026-10-29T00:00:00.000Z" }),
      record({ url: "figentra://c", updatedAt: "2026-10-28T00:00:00.000Z" }),
    ];
    const items = indexableItems({ ...RULES, maxItems: 2 }, USER, records, NOW);
    expect(items.map((item) => item.url)).toEqual(["figentra://b", "figentra://c"]);
  });
});
