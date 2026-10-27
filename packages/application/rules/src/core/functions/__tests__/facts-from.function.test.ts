/**
 * Stackra file contract:
 * Purpose: unit tests of `factsFrom` and the `FactProvider` port: each provider's facts land under its source key and
 *          a rule tests them through `evaluate` ("the subject is in segment X"); no provider gives no facts; two
 *          providers of one key and a rejecting provider throw.
 * Boundary: test only; the providers are in-test drivers of the port.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0331 (decision 4); ADR 0462 (decision 1).
 */
import { Driver } from "@stackra/container";
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { type FactSource, FieldType, Operator } from "#contracts/index";
import { evaluate } from "#core/functions/evaluate.function";
import { factsFrom } from "#core/functions/facts-from.function";
import { FactProvider } from "#core/ports/fact-provider.port";
import type { FactSubject } from "#core/types/fact-subject.type";
import type { Facts } from "#core/types/facts.type";
import { Rules } from "#core/values/rules.value";

const VIP = "seg_01j9z3k4m5n6p7q8r9s0t1v2v1";
const CUSTOMER: FactSubject = { model: "commerce.customer", id: "cus_01j9z3k4m5n6p7q8r9s0t1v2c1" };

/** A provider of `key` that answers `facts`, recording every subject it is asked about. */
class StubFactProviderDriver extends Driver(FactProvider) {
  override readonly source: FactSource;

  readonly asked: FactSubject[] = [];

  private readonly facts: Facts[string] | Error;

  constructor(key: string, facts: Facts[string] | Error) {
    super();
    this.source = {
      key,
      fields: { ids: { type: FieldType.List, label: `${key}::facts.ids` as I18nKey } },
    };
    this.facts = facts;
  }

  override factsOf(subject: FactSubject): Promise<Facts[string]> {
    this.asked.push(subject);
    return this.facts instanceof Error ? Promise.reject(this.facts) : Promise.resolve(this.facts);
  }
}

describe("factsFrom", () => {
  it("keys each provider's facts by its source, so a rule tests segment membership", async () => {
    const segments = new StubFactProviderDriver("segments", { ids: [VIP] });
    const facts = await factsFrom([segments], CUSTOMER);

    expect(segments).toBeInstanceOf(FactProvider);
    expect(segments.asked).toEqual([CUSTOMER]);
    expect(facts).toEqual({ segments: { ids: [VIP] } });
    const rules = Rules.create({ key: "orders.cancel", sources: [segments.source] });
    const inVip = rules.check({ field: "segments.ids", operator: Operator.Includes, value: VIP });
    const now = new Date("2026-10-28T09:00:00Z");
    expect(evaluate(rules, inVip, facts, { now }).matched).toBe(true);
    expect(evaluate(rules, inVip, { segments: { ids: [] } }, { now }).matched).toBe(false);
  });

  it("gives no facts without a provider", async () => {
    expect(await factsFrom([], CUSTOMER)).toEqual({});
  });

  it("throws on two providers of one source and on a rejecting provider", async () => {
    await expect(
      factsFrom(
        [new StubFactProviderDriver("segments", {}), new StubFactProviderDriver("segments", {})],
        CUSTOMER,
      ),
    ).rejects.toThrow("two fact providers supply the source `segments`");
    await expect(
      factsFrom([new StubFactProviderDriver("segments", new Error("down"))], CUSTOMER),
    ).rejects.toThrow("down");
  });
});
