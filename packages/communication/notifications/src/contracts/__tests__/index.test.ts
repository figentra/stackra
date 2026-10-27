/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the channel ports (the template's `MailTransport`
 *          among them) and the inbound `WhatsAppInbound` port are exported as values, nothing else is, and the types they exchange
 *          resolve (`ContentFreeData` among them, STA-964).
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  ContentFreeData,
  InAppEntry,
  InAppMessage,
  InboundWhatsApp,
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
      "WhatsAppInbound",
      "WhatsAppTransport",
    ]);
  });

  it("exports the exchanged types", () => {
    expectTypeOf<OutboundMail["subject"]>().toEqualTypeOf<string>();
    expectTypeOf<keyof ContentFreeData>().toEqualTypeOf<"kind" | "link">();
    expectTypeOf<OutboundSms["text"]>().toEqualTypeOf<string>();
    expectTypeOf<OutboundChatMessage["channel"]>().toEqualTypeOf<string>();
    expectTypeOf<InAppMessage["kind"]>().toEqualTypeOf<string>();
    expectTypeOf<InAppEntry["readAt"]>().toEqualTypeOf<Date | null>();
    expectTypeOf<InboundWhatsApp["kind"]>().toEqualTypeOf<"text" | "cart" | "reply">();
  });
});
