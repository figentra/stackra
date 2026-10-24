/**
 * Stackra file contract:
 * Purpose: unit tests of `intents`: the generated table is returned frozen and recorded for the intent router, and a
 *          later table replaces it.
 * Boundary: test only; the entries restate the template's generated `apps/console/.stackra/gen/intents.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0155 (intents).
 */
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { INTENT_ENTRIES } from "#core/constants/intent-entries.constant";
import { actionRef } from "#core/functions/action-ref.function";
import { intents } from "#core/functions/intents.function";
import { queryRef } from "#core/functions/query-ref.function";

class ArchiveProductAction extends actionRef("catalogue.product.archive@1", {
  input: z.object({ productId: z.string() }),
  output: z.object({}),
}) {}

class ListOrdersQuery extends queryRef("orders.order.list@1", {
  input: z.object({}),
  output: z.object({}),
}) {}

const ARCHIVE = {
  ref: ArchiveProductAction,
  phrases: "catalogue::actions.product.archive.intents" as I18nKey,
  icon: "archive",
};

describe("intents", () => {
  it("returns the table frozen and records it", () => {
    const table = intents([ARCHIVE]);
    expect(table).toEqual([ARCHIVE]);
    expect(Object.isFrozen(table)).toBe(true);
    expect(Object.isFrozen(table[0])).toBe(true);
    expect(INTENT_ENTRIES).toEqual([ARCHIVE]);
  });

  it("replaces an earlier table", () => {
    intents([ARCHIVE]);
    const list = {
      ref: ListOrdersQuery,
      phrases: "orders::actions.order.list.intents" as I18nKey,
      icon: "receipt",
      opens: "orders",
    };
    intents([list]);
    expect(INTENT_ENTRIES).toEqual([list]);
  });
});
