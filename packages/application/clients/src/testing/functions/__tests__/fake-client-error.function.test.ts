/**
 * Stackra file contract:
 * Purpose: unit tests of `fakeClientError`: an instance of a consumed refusal class with its message key and the given
 *          message, or a server refusal with only the message.
 * Boundary: test only; the refusal restates the template's generated `apps/mobile` commerce client.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (fakes); ADR 0140.
 */
import { isRefusal } from "@stackra/errors";
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { ServerRefusalError } from "#core/errors/server-refusal.error";
import { refusalRef } from "#core/functions/refusal-ref.function";
import { fakeClientError } from "#testing/functions/fake-client-error.function";

const MESSAGE = "inventory::errors.insufficient_stock.message" as I18nKey;

class InsufficientStockError extends refusalRef("inventory.insufficient_stock", {
  message: MESSAGE,
}) {}

describe("fakeClientError", () => {
  it("builds the consumed refusal with its message key and the given message", () => {
    const error = fakeClientError({ refusal: InsufficientStockError, message: "raw" });
    expect(isRefusal(error, InsufficientStockError)).toBe(true);
    expect(error.refusalKey).toBe(MESSAGE);
    expect(error.message).toBe("raw");
  });

  it("builds a server refusal with only a message", () => {
    const error = fakeClientError({ message: "Something broke" });
    expect(error).toBeInstanceOf(ServerRefusalError);
    expect(error.refusalKey).toBeUndefined();
    expect(error.message).toBe("Something broke");
  });

  it("keeps the code as the message when none is given", () => {
    expect(fakeClientError().message).toBe("server_refusal");
  });
});
