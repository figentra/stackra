/**
 * Stackra file contract:
 * Purpose: unit tests of `assertContentFree`: a content-free template that reads only the record's kind and link
 *          passes, one that reads any other field (plain or as a plural argument) is refused with the field named, and
 *          a full template is never checked.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; row "content-free templates for restricted records"; STA-964.
 */
import { describe, expect, it } from "@stackra/testing";

import { NotificationChannel } from "#contracts/enums/notification-channel.enum";
import { TemplateVariant } from "#contracts/enums/template-variant.enum";
import type { NotificationTemplate } from "#contracts/types/notification-template.type";
import { RestrictedFieldError } from "#core/errors/restricted-field.error";
import { assertContentFree } from "#core/functions/assert-content-free.function";

const template = (
  content: Record<string, string>,
  variant: TemplateVariant = TemplateVariant.ContentFree,
): NotificationTemplate => ({
  key: "matters.update",
  channel: NotificationChannel.Sms,
  locale: "en",
  variant,
  content,
});

describe("assertContentFree", () => {
  it("passes a template that names only the kind and a link", () => {
    expect(() =>
      assertContentFree(template({ title: "New {kind}", body: "A {kind} changed: { link }" })),
    ).not.toThrow();
    expect(() => assertContentFree(template({ body: "Sign in to read it." }))).not.toThrow();
  });

  it("refuses a field of the record and names it", () => {
    let caught: unknown;
    try {
      assertContentFree(template({ subject: "{kind}", body: "{kind} for {client_name}" }));
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(RestrictedFieldError);
    expect(caught).toMatchObject({ key: "matters.update", part: "body", field: "client_name" });
  });

  it("refuses a field read as a plural or select argument", () => {
    expect(() =>
      assertContentFree(template({ body: "{count, plural, one {# note} other {# notes}}" })),
    ).toThrow(RestrictedFieldError);
  });

  it("never checks a full template", () => {
    expect(() =>
      assertContentFree(template({ body: "{client_name}" }, TemplateVariant.Full)),
    ).not.toThrow();
  });
});
