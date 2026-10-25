/**
 * Stackra file contract:
 * Purpose: unit tests of `registerVisibility`: a row for a model with `@Visibility` is stored with its followed
 *          relations resolved to their target models, a later row replaces it, and a row that does not match the
 *          facet (no facet, a bad key, no stated `unmatched`, rules that are not exactly the attributes, a geo
 *          attribute, a followed relation that is not a many-to-one to a declaring model) is refused.
 * Boundary: test only; the models are declared here with `@stackra/model`. The registry is cleared before each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0333 (decisions 1, 4 and 7, and its amendment: relations).
 */
import { ManyToOne, Model, Visibility } from "@stackra/model";
import type { Ref } from "@stackra/model";
import { Rules } from "@stackra/rules";
import { type FactField, FieldType } from "@stackra/rules/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { Decision } from "#core/index";
import { VISIBILITY_REGISTRY } from "#node/constants/visibility-registry.constant";
import { registerVisibility } from "#node/functions/register-visibility.function";
import type { VisibilityRegistration } from "#node/types/visibility-registration.type";

/** A label key, as a fact field takes it. */
const label = (name: string): FactField["label"] => `legal::fields.${name}` as FactField["label"];

/** The `record` fact source of `fields`. */
const recordRules = (fields: Record<string, FactField>): Rules =>
  Rules.create({ key: "legal.matter", sources: [{ key: "record", fields }] });

const MATTER_RULES = recordRules({ status: { type: FieldType.String, label: label("status") } });

@Visibility({ attributes: ["status"] })
class Matter extends Model.with() {
  status!: string;
}

@Visibility({ follows: ["matter"] })
class Document extends Model.with() {
  @ManyToOne(() => Matter)
  matter!: Ref<Matter>;
}

class Invoice extends Model.with() {}

@Visibility({ follows: ["invoice"] })
class Receipt extends Model.with() {
  @ManyToOne(() => Invoice)
  invoice!: Ref<Invoice>;
}

const MATTER_ROW: VisibilityRegistration = {
  model: Matter,
  key: "legal.matter",
  rules: MATTER_RULES,
  unmatched: Decision.Deny,
};

describe(registerVisibility, () => {
  beforeEach(() => {
    VISIBILITY_REGISTRY.clear();
  });

  it("stores each row with its followed relations resolved", () => {
    registerVisibility([
      MATTER_ROW,
      { model: Document, key: "legal.document", unmatched: Decision.Allow },
    ]);
    expect(VISIBILITY_REGISTRY.get(Matter)).toEqual({ row: MATTER_ROW, follows: [] });
    expect(VISIBILITY_REGISTRY.get(Document)?.follows).toEqual([["matter", Matter]]);
    registerVisibility([{ ...MATTER_ROW, unmatched: Decision.Allow }]);
    expect(VISIBILITY_REGISTRY.get(Matter)?.row.unmatched).toBe(Decision.Allow);
  });

  it("refuses a row that does not match the model's facet", () => {
    const refused: readonly VisibilityRegistration[] = [
      { ...MATTER_ROW, model: Invoice },
      { ...MATTER_ROW, key: "Matter" },
      { ...MATTER_ROW, unmatched: Decision.Abstain as unknown as typeof Decision.Deny },
      { model: Matter, key: "legal.matter", unmatched: Decision.Deny },
      {
        ...MATTER_ROW,
        rules: recordRules({
          status: { type: FieldType.String, label: label("status") },
          secret: { type: FieldType.String, label: label("secret") },
        }),
      },
      {
        ...MATTER_ROW,
        rules: recordRules({ state: { type: FieldType.String, label: label("s") } }),
      },
      { model: Document, key: "legal.document", rules: MATTER_RULES, unmatched: Decision.Allow },
      { model: Receipt, key: "billing.receipt", unmatched: Decision.Allow },
    ];
    for (const row of refused) expect(() => registerVisibility([row])).toThrow(TypeError);
    expect(VISIBILITY_REGISTRY.size).toBe(0);
  });

  it("refuses a geo attribute and a followed name that is not a relation", () => {
    @Visibility({ attributes: ["location"] })
    class Store extends Model.with() {}
    @Visibility({ follows: ["owner"] })
    class Note extends Model.with() {}
    expect(() =>
      registerVisibility([
        {
          model: Store,
          key: "retail.store",
          rules: recordRules({ location: { type: FieldType.Geo, label: label("location") } }),
          unmatched: Decision.Deny,
        },
      ]),
    ).toThrow(TypeError);
    expect(() =>
      registerVisibility([{ model: Note, key: "legal.note", unmatched: Decision.Deny }]),
    ).toThrow(TypeError);
  });
});
