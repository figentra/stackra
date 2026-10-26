/**
 * Stackra file contract:
 * Purpose: unit tests of `PackSchemaRegistry`: a clean pack has no issue; an unregistered, an undeclared key, a value
 *          its JSON Schema refuses and a required key missing from a root pack are each reported; overlays and other
 *          sections are not asked for required keys; a subject naming a prefix passes; a `*` key declares a family;
 *          bad registrations are refused.
 * Boundary: test only. Schemas and packs are made-up fixtures (`xa`, `shop`), not any market's values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0417.
 */
import { describe, expect, it } from "@stackra/testing";

import { PackIssueCode } from "#core/enums/pack-issue-code.enum";
import { PackStatus } from "#core/enums/pack-status.enum";
import { PackSubject } from "#core/enums/pack-subject.enum";
import type { MarketPack } from "#core/types/market-pack.type";
import type { PackSchema } from "#core/types/pack-schema.type";
import { PackSchemaRegistry } from "#core/values/pack-schema-registry.value";

const BILLING: PackSchema = {
  prefix: "billing",
  owner: "os",
  keys: [
    { key: "billing.currency", schema: { type: "string", pattern: "^[A-Z]{3}$" }, required: true },
    { key: "billing.days", schema: { type: "integer", minimum: 0 } },
  ],
};

const SHOP: PackSchema = {
  prefix: "shop",
  owner: "shop",
  section: "shop",
  keys: [{ key: "shop.tips", schema: { type: "boolean" }, required: true }],
};

/** A pack version with `entries`. */
function pack(entries: MarketPack["entries"], extra: Partial<MarketPack> = {}): MarketPack {
  return {
    market: "xa",
    version: "1.0.0",
    status: PackStatus.Draft,
    entries,
    reviews: [],
    checklist: [],
    ...extra,
  };
}

const codes = (registry: PackSchemaRegistry, checked: MarketPack) =>
  registry.check(checked).map((issue) => `${issue.code} ${issue.key}`);

describe("PackSchemaRegistry", () => {
  const registry = PackSchemaRegistry.create([BILLING, SHOP]);

  it("passes a pack whose keys are declared and values valid", () => {
    expect(
      registry.check(pack([{ key: "billing.currency", value: "USD", from: "2026-01-01" }])),
    ).toEqual([]);
  });

  it("reports unregistered and undeclared keys and invalid values", () => {
    expect(
      codes(
        registry,
        pack([
          { key: "billing.currency", value: "usd", from: "2026-01-01" },
          { key: "billing.days", value: -1, from: "2026-01-01" },
          { key: "billing.unknown", value: 1, from: "2026-01-01" },
          { key: "tax.rate", value: 1, from: "2026-01-01" },
        ]),
      ),
    ).toEqual([
      "key_undeclared billing.unknown",
      "key_unregistered tax.rate",
      "value_invalid billing.currency",
      "value_invalid billing.days",
    ]);
  });

  it("asks a root base pack for its required keys, never an overlay or another section", () => {
    expect(codes(registry, pack([]))).toEqual(["key_required billing.currency"]);
    expect(registry.check(pack([], { extends: "xb" }))).toEqual([]);
    expect(codes(registry, pack([], { section: "shop" }))).toEqual(["key_required shop.tips"]);
  });

  it("accepts a subject or review that names a registered prefix", () => {
    const issues = registry.check(
      pack([{ key: "billing.currency", value: "USD", from: "2026-01-01" }], {
        subjects: [{ key: "billing", subject: PackSubject.Tenant }],
        reviews: [{ key: "billing.currency", reviewer: "counsel", at: "2026-01-02" }],
      }),
    );
    expect(issues).toEqual([]);
  });

  it("lets the longest prefix own a key", () => {
    const nested = PackSchemaRegistry.create([
      BILLING,
      {
        prefix: "billing.cards",
        owner: "payments",
        keys: [{ key: "billing.cards.on", schema: { type: "boolean" } }],
      },
    ]);
    const issues = nested.check(
      pack([
        { key: "billing.currency", value: "USD", from: "2026-01-01" },
        { key: "billing.cards.off", value: true, from: "2026-01-01" },
      ]),
    );
    expect(issues.map((issue) => issue.message)).toEqual([
      "The billing.cards schema of payments does not declare billing.cards.off",
    ]);
  });

  it("refuses a repeated prefix, a repeated key and a key outside its prefix", () => {
    expect(() => PackSchemaRegistry.create([BILLING, BILLING])).toThrow(RangeError);
    expect(() =>
      PackSchemaRegistry.create([
        BILLING,
        { prefix: "billing.extra", owner: "os", keys: [{ key: "billing.currency", schema: true }] },
      ]),
    ).toThrow(RangeError);
    expect(() =>
      PackSchemaRegistry.create([
        { prefix: "tax", owner: "os", keys: [{ key: "tips.on", schema: true }] },
      ]),
    ).toThrow(RangeError);
    expect(() =>
      PackSchemaRegistry.create([{ prefix: "tax", owner: "shop", section: "shop", keys: [] }]),
    ).toThrow(RangeError);
  });

  it("declares a family of keys with a * segment, an exact key winning over it", () => {
    const family = PackSchemaRegistry.create([
      {
        prefix: "relay",
        owner: "os",
        keys: [
          { key: "relay.*", schema: { type: "array" } },
          { key: "relay.fixed", schema: { type: "boolean" } },
        ],
      },
    ]);
    const issues = family.check(
      pack([
        { key: "relay.alpha", value: ["one"], from: "2026-01-01" },
        { key: "relay.beta", value: "one", from: "2026-01-01" },
        { key: "relay.fixed", value: true, from: "2026-01-01" },
        { key: "relay.alpha.deep", value: [], from: "2026-01-01" },
      ]),
    );
    expect(issues.map((issue) => `${issue.code} ${issue.key}`)).toEqual([
      "key_undeclared relay.alpha.deep",
      "value_invalid relay.beta",
    ]);
    expect(() =>
      PackSchemaRegistry.create([
        { prefix: "relay", owner: "os", keys: [{ key: "relay.*", schema: true, required: true }] },
      ]),
    ).toThrow(RangeError);
  });

  it("reports nothing twice for a key named by an entry, a subject and a review", () => {
    const issues = registry.check(
      pack([{ key: "other.key", value: 1, from: "2026-01-01" }], {
        extends: "xb",
        subjects: [{ key: "other.key", subject: PackSubject.Buyer }],
      }),
    );
    expect(issues.map((issue) => issue.code)).toEqual([PackIssueCode.KeyUnregistered]);
  });
});
