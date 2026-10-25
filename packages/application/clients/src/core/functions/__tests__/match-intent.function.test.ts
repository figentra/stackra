/**
 * Stackra file contract:
 * Purpose: unit tests of `matchIntent`: the best action intent by the share of a phrase's words in the text, the
 *          threshold, the session's permissions, query intents left out, Arabic phrases, and empty text.
 * Boundary: test only; phrases come from a plain map standing in for the translator.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0155 (intents).
 */
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { actionRef } from "#core/functions/action-ref.function";
import { matchIntent } from "#core/functions/match-intent.function";
import { queryRef } from "#core/functions/query-ref.function";
import type { IntentEntry } from "#core/types/intent-entry.type";

class ArchiveProductAction extends actionRef("catalogue.product.archive@1", {
  input: z.object({ productId: z.string() }),
  output: z.object({}),
}) {}

class CreateOrderAction extends actionRef("orders.order.create@1", {
  input: z.object({}),
  output: z.object({}),
}) {}

class ListOrdersQuery extends queryRef("orders.order.list@1", {
  input: z.object({}),
  output: z.object({}),
}) {}

const PHRASES = new Map<string, readonly string[]>([
  [
    "catalogue::actions.product.archive.intents",
    ["archive the summer dress", "أرشف الفستان الصيفي"],
  ],
  ["orders::actions.order.create.intents", ["place an order", "buy these items"]],
  ["orders::actions.order.list.intents", ["show my orders"]],
]);

const entry = (ref: IntentEntry["ref"], phrases: string): IntentEntry => ({
  ref,
  phrases: phrases as I18nKey,
  icon: "icon",
});

const ENTRIES = [
  entry(ArchiveProductAction, "catalogue::actions.product.archive.intents"),
  entry(CreateOrderAction, "orders::actions.order.create.intents"),
  entry(ListOrdersQuery, "orders::actions.order.list.intents"),
];

const phrasesOf = (key: I18nKey) => PHRASES.get(key) ?? [];
const everything = () => true;
const onlyOrders = (permission: string) => permission.startsWith("orders.");

describe("matchIntent", () => {
  it("picks the action whose phrase the text says", () => {
    expect(matchIntent("Archive the summer dress!", ENTRIES, everything, phrasesOf)?.ref).toBe(
      ArchiveProductAction,
    );
    expect(matchIntent("please place an order", ENTRIES, everything, phrasesOf)?.ref).toBe(
      CreateOrderAction,
    );
  });

  it("matches an Arabic phrase", () => {
    expect(matchIntent("أرشف الفستان الصيفي", ENTRIES, everything, phrasesOf)?.ref).toBe(
      ArchiveProductAction,
    );
  });

  it("proposes nothing below the threshold or for empty text", () => {
    expect(matchIntent("archive", ENTRIES, everything, phrasesOf)).toBeUndefined();
    expect(matchIntent("  ", ENTRIES, everything, phrasesOf)).toBeUndefined();
  });

  it("leaves out actions the session may not run and every query intent", () => {
    expect(matchIntent("archive the summer dress", ENTRIES, onlyOrders, phrasesOf)).toBeUndefined();
    expect(matchIntent("show my orders", ENTRIES, everything, phrasesOf)).toBeUndefined();
  });
});
