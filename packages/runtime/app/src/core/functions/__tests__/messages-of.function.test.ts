/**
 * Stackra file contract:
 * Purpose: unit tests of `messagesOf`: it loads through the wiring's `messages` section for the given locale, and a
 *          wiring without the section fails naming the member and the locale.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decision 10).
 */
import { Locale } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { messagesOf } from "#core/functions/messages-of.function";

describe("messagesOf", () => {
  it("loads the locale's catalogues through the wiring", async () => {
    const messages = { web: { nav: { home: "الرئيسية" } } };
    const load = vi.fn(() => Promise.resolve(messages));
    await expect(messagesOf({ member: "mobile", messages: load }, Locale.Ar)).resolves.toBe(
      messages,
    );
    expect(load).toHaveBeenCalledWith(Locale.Ar);
  });

  it("fails when the wiring has no messages loader", async () => {
    await expect(messagesOf({ member: "mobile" }, Locale.Ar)).rejects.toThrow(
      /mobile.*ar.*stackra gen/,
    );
  });
});
