/**
 * Stackra file contract:
 * Purpose: unit tests of `resolveTemplate`: the nearest scope's override wins over the code default; the locale chain
 *          comes before the scope chain; a restricted record takes only the content-free variant and never falls back
 *          to the full one.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0223 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { NotificationChannel } from "#contracts/enums/notification-channel.enum";
import { TemplateVariant } from "#contracts/enums/template-variant.enum";
import type { NotificationTemplate } from "#contracts/types/notification-template.type";
import { NoTemplateError } from "#core/errors/no-template.error";
import { resolveTemplate } from "#core/functions/resolve-template.function";

const template = (
  locale: string,
  scope?: string,
  variant: TemplateVariant = TemplateVariant.Full,
): NotificationTemplate => ({
  key: "orders.order_receipt",
  channel: NotificationChannel.Sms,
  locale,
  variant,
  ...(scope === undefined ? {} : { scope }),
  content: { body: `${locale}:${scope ?? "default"}:${variant}` },
});

const query = {
  key: "orders.order_receipt",
  channel: NotificationChannel.Sms,
  locales: ["ar-SA", "ar", "en"],
  scopes: ["branch_1", "tenant_1"],
  restricted: false,
};

describe("resolveTemplate", () => {
  it("takes the nearest scope's override, then the code default", () => {
    const candidates = [template("ar"), template("ar", "tenant_1"), template("en", "branch_1")];
    expect(resolveTemplate(candidates, query).content["body"]).toBe("ar:tenant_1:full");
    expect(resolveTemplate([template("ar")], query).content["body"]).toBe("ar:default:full");
  });

  it("prefers the recipient's language over a nearer scope in another", () => {
    const candidates = [template("en", "branch_1"), template("ar")];
    expect(resolveTemplate(candidates, query).locale).toBe("ar");
  });

  it("takes only the content-free variant for a restricted record", () => {
    const candidates = [
      template("ar", "tenant_1"),
      template("en", undefined, TemplateVariant.ContentFree),
    ];
    expect(resolveTemplate(candidates, { ...query, restricted: true }).content["body"]).toBe(
      "en:default:content_free",
    );
    expect(() => resolveTemplate([template("ar")], { ...query, restricted: true })).toThrow(
      NoTemplateError,
    );
  });
});
