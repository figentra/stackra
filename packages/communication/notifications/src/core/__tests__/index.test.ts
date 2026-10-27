/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the template's `Notification`, `NotificationCategory`, `Notifier`
 *          and `Recipient` values and `MailMessage` type, plus the registry row's configuration and memory driver
 *          (gen's wiring imports `MemoryNotifierDriver` from here), and the inbound WhatsApp drivers with Meta's signature
 *          recipe (ADR 0448), the content-free check and mandatory-category answer (STA-964) and the `DeliveryRecorded`
 *          event (stackra-207) are exported, nothing else is.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { NOTIFICATIONS_CONFIG_SCHEMA } from "#core/constants/notifications-config-schema.constant";
import * as notifications from "#core/index";
import type { MailMessage, NotificationDelivery } from "#core/index";

describe("@stackra/notifications", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(notifications).sort()).toEqual([
      "CONTENT_FREE_FIELDS",
      "ConnectionMailTransportDriver",
      "ConnectionSmsTransportDriver",
      "ConnectionWhatsAppTransportDriver",
      "DeliveryRecorded",
      "DevicePushTransportDriver",
      "META_WHATSAPP_WEBHOOK_SIGNATURE",
      "MemoryNotifierDriver",
      "MemoryWhatsAppInboundDriver",
      "MetaWhatsAppInboundDriver",
      "NoTemplateError",
      "Notification",
      "NotificationCategory",
      "NotificationsConfig",
      "NotificationsConfig$",
      "NotificationsOptions",
      "Notifier",
      "Recipient",
      "RestrictedFieldError",
      "assertContentFree",
      "canMute",
      "dueEscalations",
      "resolveTemplate",
      "sendAfter",
      "twiml",
    ]);
  });

  it("exports the shipped schema under its generated name", () => {
    expect(notifications.NotificationsConfig$).toBe(NOTIFICATIONS_CONFIG_SCHEMA);
  });

  it("exports MailMessage and NotificationDelivery as types", () => {
    expectTypeOf<NotificationDelivery["mail"]>().toEqualTypeOf<MailMessage | null>();
  });
});
