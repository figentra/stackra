/**
 * Stackra file contract:
 * Purpose: unit tests of `BASE_PACK_SCHEMAS`: they register without a clash, accept a channel chain per category, a
 *          prayer-hold default, a provider list per capability, a legacy encoding, identity formats and an AI approval
 *          floor, and refuse values of the wrong shape; a market's own keys are left to their owners.
 * Boundary: test only. Markets are made-up (`xa`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0417; STA-1252; STA-1301.
 */
import { describe, expect, it } from "@stackra/testing";

import { BASE_PACK_SCHEMAS } from "#core/constants/base-pack-schemas.constant";
import { PackStatus } from "#core/enums/pack-status.enum";
import type { MarketPack } from "#core/types/market-pack.type";
import { PackSchemaRegistry } from "#core/values/pack-schema-registry.value";

/** A root pack with one entry per `[key, value]`. */
const pack = (values: readonly (readonly [string, unknown])[]): MarketPack => ({
  market: "xa",
  version: "1.0.0",
  status: PackStatus.Draft,
  entries: values.map(([key, value]) => ({ key, value: value as never, from: "2026-01-01" })),
  reviews: [],
  checklist: [],
});

const issues = (values: readonly (readonly [string, unknown])[]) =>
  PackSchemaRegistry.create(BASE_PACK_SCHEMAS)
    .check(pack(values))
    .map((issue) => `${issue.code} ${issue.key}`);

describe("BASE_PACK_SCHEMAS", () => {
  it("accepts every key it declares with a valid value and asks a root pack for none", () => {
    expect(
      issues([
        ["notifications.channels.security", ["whatsapp", "sms", "mail"]],
        ["notifications.channels.marketing", ["in_app"]],
        ["notifications.prayer_holds", true],
        ["providers.sms", ["unifonic", { provider: "twilio", status: "planned" }]],
        ["providers.payroll", []],
        ["imports.legacy_encoding", "windows-1256"],
      ]),
    ).toEqual([]);
  });

  it("refuses values of the wrong shape", () => {
    expect(
      issues([
        ["notifications.channels.security", []],
        ["notifications.prayer_holds", "yes"],
        ["providers.sms", [{ status: "live" }]],
        ["imports.legacy_encoding", "Windows 1256"],
      ]),
    ).toEqual([
      "value_invalid notifications.channels.security",
      "value_invalid notifications.prayer_holds",
      "value_invalid providers.sms",
      "value_invalid imports.legacy_encoding",
    ]);
  });

  it("checks identity formats and the AI approval floor", () => {
    expect(
      issues([
        ["identity.national_ids", { national_id: { pattern: "^1\\d{9}$", check: "luhn" } }],
        [
          "identity.address_format",
          { required: ["locality"], layout: [["lines"], ["locality"], ["country"]] },
        ],
        [
          "ai.approval_floor",
          { tags: ["financial"], deletes: true, actions: ["legal.filing.submit"] },
        ],
      ]),
    ).toEqual([]);
    expect(
      issues([
        ["identity.national_ids", { "National ID": { pattern: "^1$" } }],
        ["identity.address_format", { required: ["street"], layout: [] }],
        ["ai.approval_floor", { tags: [""], recipientLimit: -1 }],
      ]),
    ).toEqual([
      "value_invalid identity.national_ids",
      "value_invalid identity.address_format",
      "value_invalid ai.approval_floor",
    ]);
  });

  it("declares one segment after a family prefix and leaves other section keys unregistered", () => {
    expect(
      issues([
        ["notifications.channels.security.extra", ["sms"]],
        ["notifications.quiet_hours", true],
      ]),
    ).toEqual([
      "key_undeclared notifications.channels.security.extra",
      "key_unregistered notifications.quiet_hours",
    ]);
  });
});
