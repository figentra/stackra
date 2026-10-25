/**
 * Stackra file contract:
 * Purpose: unit tests of `NotificationChannel` and `TemplateVariant`: their codes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0223; ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { NotificationChannel } from "#contracts/enums/notification-channel.enum";
import { TemplateVariant } from "#contracts/enums/template-variant.enum";

describe("NotificationChannel and TemplateVariant", () => {
  it("have their codes", () => {
    expect(Enum.values(NotificationChannel)).toEqual([
      "mail",
      "sms",
      "whatsapp",
      "push",
      "in_app",
      "chat",
      "voice",
    ]);
    expect(Enum.values(TemplateVariant)).toEqual(["full", "content_free"]);
  });
});
