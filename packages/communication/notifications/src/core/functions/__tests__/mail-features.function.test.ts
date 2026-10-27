/**
 * Stackra file contract:
 * Purpose: unit tests of `mailFeatures` and `assertMailHeaders`: a plain mail uses no optional part, each optional part
 *          is named once in `MailFeature` order, empty lists count as unused; a header with a line break or a colon in
 *          its name is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; RFC 5322; stackra-218 (STA-1376).
 */
import { describe, expect, it } from "@stackra/testing";

import type { OutboundMail } from "#contracts/types/outbound-mail.type";
import { assertMailHeaders } from "#core/functions/assert-mail-headers.function";
import { mailFeatures } from "#core/functions/mail-features.function";

const MAIL: OutboundMail = {
  to: "a@acme.example",
  from: "o@acme.example",
  subject: "S",
  html: "<p/>",
  text: "",
};

describe("mailFeatures", () => {
  it("names nothing for a plain mail or empty parts", () => {
    expect(mailFeatures(MAIL)).toEqual([]);
    expect(mailFeatures({ ...MAIL, cc: [], bcc: [], headers: {}, attachments: [] })).toEqual([]);
  });

  it("names every part used", () => {
    expect(
      mailFeatures({
        ...MAIL,
        cc: ["c@acme.example"],
        bcc: ["b@acme.example"],
        replyTo: "r@acme.example",
        headers: { "X-Tag": "1" },
        attachments: [
          { filename: "a.pdf", contentType: "application/pdf", content: new Uint8Array([1]) },
          { filename: "l.png", contentType: "image/png", ref: "media/l.png", contentId: "logo" },
        ],
      }),
    ).toEqual(["attachments", "attachmentRefs", "inline", "cc", "bcc", "replyTo", "headers"]);
  });
});

describe("assertMailHeaders", () => {
  it("passes plain headers and refuses injected ones", () => {
    expect(() => assertMailHeaders({ ...MAIL, headers: { "X-Tag": "a b" } })).not.toThrow();
    expect(() =>
      assertMailHeaders({ ...MAIL, headers: { "X-Tag": "a\r\nBcc: x@evil.example" } }),
    ).toThrow(TypeError);
    expect(() => assertMailHeaders({ ...MAIL, headers: { "X:Tag": "a" } })).toThrow(TypeError);
    expect(() => assertMailHeaders({ ...MAIL, headers: { "X Tag": "a" } })).toThrow(TypeError);
  });
});
