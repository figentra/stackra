/**
 * Stackra file contract:
 * Purpose: proves `appMessages` hands the share inbox its strings in Arabic and English, every key the screen reads
 *          present in both, and English for any other locale.
 * Boundary: the function and the key constant only; the catalogues are the package's JSON.
 * Runtime: node
 * Governing contract: ADR 0268 (R15); ADR 0022 (test placement).
 */
import { formatMessage, Locale } from "@stackra/i18n";
import { describe, expect, it } from "vitest";

import { SHARE_INBOX_KEYS } from "../../constants/share-inbox-keys.constant";
import { appMessages } from "../app-messages.function";

describe("appMessages", () => {
  it("holds every share inbox key in Arabic and English", () => {
    for (const locale of [Locale.En, Locale.Ar])
      for (const key of Object.values(SHARE_INBOX_KEYS.native_share.inbox))
        expect(formatMessage(appMessages(locale), key, undefined, locale)).not.toBe("");
  });

  it("reads English for a locale the app does not ship", () => {
    expect(appMessages(Locale.De)).toBe(appMessages(Locale.En));
  });
});
