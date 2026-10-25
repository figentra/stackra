/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the four channel ports (the template's `MailTransport`
 *          among them) are exported as values, nothing else is, and the types they exchange resolve.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  InAppEntry,
  InAppMessage,
  OutboundChatMessage,
  OutboundMail,
  OutboundSms,
} from "#contracts/index";

describe("@stackra/notifications/contracts", () => {
  it("exports exactly its ports and enums", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "ChatTransport",
      "InAppStore",
      "MailTransport",
      "NotificationChannel",
      "PushTokenStore",
      "PushTransport",
      "SendLog",
      "SmsTransport",
      "TemplateOverrides",
      "TemplateVariant",
      "WhatsAppTransport",
    ]);
  });

  it("exports the exchanged types", () => {
    expectTypeOf<OutboundMail["subject"]>().toEqualTypeOf<string>();
    expectTypeOf<OutboundSms["text"]>().toEqualTypeOf<string>();
    expectTypeOf<OutboundChatMessage["channel"]>().toEqualTypeOf<string>();
    expectTypeOf<InAppMessage["kind"]>().toEqualTypeOf<string>();
    expectTypeOf<InAppEntry["readAt"]>().toEqualTypeOf<Date | null>();
  });
});
