/**
 * Stackra file contract:
 * Purpose: unit and type tests of `MailMessage`: an empty message has no subject, `subject` returns a new frozen
 *          message with the key and a copy of the values, and a raw string is not a subject key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0080 (i18n keys, never literals).
 */
import { keys } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { MailMessage } from "#core/values/mail-message.value";

const I18n = keys({ orders: { order_receipt: { mail: ["subject"] } } });

describe("MailMessage", () => {
  it("starts without a subject", () => {
    const empty = new MailMessage();
    expect(empty.subjectKey).toBeNull();
    expect(empty.subjectValues).toEqual({});
  });

  it("returns a new frozen message from subject", () => {
    const empty = new MailMessage();
    const values = { id: "ord_1" };
    const mail = empty.subject(I18n.orders.order_receipt.mail.subject, values);
    values.id = "changed";
    expect(mail).not.toBe(empty);
    expect(empty.subjectKey).toBeNull();
    expect(mail.subjectKey).toBe("orders::order_receipt.mail.subject");
    expect(mail.subjectValues).toEqual({ id: "ord_1" });
    expect(Object.isFrozen(mail)).toBe(true);
    expect(Object.isFrozen(mail.subjectValues)).toBe(true);
  });

  it("takes an i18n key, never a literal", () => {
    // @ts-expect-error a subject is an I18nKey from #stackra/i18n
    const mail = new MailMessage().subject("Your receipt");
    expect(mail.subjectKey).toBe("Your receipt");
  });
});
