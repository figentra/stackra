/**
 * Stackra file contract:
 * Purpose: type tests of `OutboundMail`: the five readonly fields the notifications service builds, addresses typed
 *          `Email`, so an address without `@` is a type error.
 * Boundary: test only; types only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0134 (addresses resolved at send time).
 */
import type { Email } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { OutboundMail } from "#contracts/types/outbound-mail.type";

describe("OutboundMail", () => {
  it("has the five readonly fields a transport sends", () => {
    expectTypeOf<OutboundMail>().toEqualTypeOf<{
      readonly to: Email;
      readonly from: Email;
      readonly subject: string;
      readonly html: string;
      readonly text: string;
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
});
