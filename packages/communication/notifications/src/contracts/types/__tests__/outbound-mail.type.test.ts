/**
 * Stackra file contract:
 * Purpose: type tests of `OutboundMail` and `MailAttachment`: the five required readonly fields plus the optional
 *          copies, reply address, headers and attachments (stackra-218), addresses typed `Email`, so an address without
 *          `@` is a type error; an attachment carries bytes or a storage reference, never both and never neither.
 * Boundary: test only; types only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0134 (addresses resolved at send time); stackra-218 (STA-1376).
 */
import type { Email } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { MailAttachment } from "#contracts/types/mail-attachment.type";
import type { OutboundMail } from "#contracts/types/outbound-mail.type";

describe("OutboundMail", () => {
  it("has the readonly fields a transport sends", () => {
    expectTypeOf<OutboundMail>().toEqualTypeOf<{
      readonly to: Email;
      readonly from: Email;
      readonly subject: string;
      readonly html: string;
      readonly text: string;
      readonly cc?: readonly Email[];
      readonly bcc?: readonly Email[];
      readonly replyTo?: Email;
      readonly headers?: Readonly<Record<string, string>>;
      readonly attachments?: readonly MailAttachment[];
    }>();
  });

  it("refuses an address without @", () => {
    const mail: OutboundMail = {
      // @ts-expect-error an Email has an @
      to: "nobody",
      from: "orders@acme.example",
      subject: "s",
      html: "<p>h</p>",
      text: "h",
    };
    expect(mail.subject).toBe("s");
  });

  it("takes an attachment by bytes or by reference, not both and not neither", () => {
    const bytes: MailAttachment = {
      filename: "invoice.pdf",
      contentType: "application/pdf",
      content: new Uint8Array([37, 80, 68, 70]),
    };
    const ref: MailAttachment = {
      filename: "logo.png",
      contentType: "image/png",
      ref: "media/logo.png",
      contentId: "logo",
    };
    // @ts-expect-error bytes and a reference together
    const both: MailAttachment = {
      filename: "a",
      contentType: "b",
      content: new Uint8Array(),
      ref: "r",
    };
    // @ts-expect-error neither bytes nor a reference
    const neither: MailAttachment = { filename: "a", contentType: "b" };
    expect([bytes, ref, both, neither]).toHaveLength(4);
  });
});
