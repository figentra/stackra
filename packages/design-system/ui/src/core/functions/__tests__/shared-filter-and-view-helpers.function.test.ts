/**
 * Stackra file contract:
 * Purpose: proves the pure helpers the web and native FilterEditor shares: `choiceOptionsOf` (value,
 *          label, and description and disabled only when given), `listedOptionIdsOf` (the options' order, unknown ids
 *          dropped) and `booleanFilterChoicesOf` (true then false, the filter's own words or the translated yes and
 *          no).
 * Boundary: pure functions; the translator is a stand-in that returns the key.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022; STA-1371.
 */
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import { booleanFilterChoicesOf } from "#core/functions/boolean-filter-choices-of.function";
import { choiceOptionsOf } from "#core/functions/choice-options-of.function";
import { listedOptionIdsOf } from "#core/functions/listed-option-ids-of.function";
import type { CatalogueText } from "#core/types/catalogue-text.type";

/** A translator that says which key it was asked for. */
const t = ((key: string) => key) as CatalogueText;

const OPTIONS = [
  { id: "open", label: "Open", description: "Not closed yet" },
  { id: "closed", label: "Closed", isDisabled: true },
];

describe("choiceOptionsOf", () => {
  it("keeps the value, the label and only the extras an item has", () => {
    expect(choiceOptionsOf(OPTIONS)).toEqual([
      { value: "open", label: "Open", description: "Not closed yet" },
      { value: "closed", label: "Closed", isDisabled: true },
    ]);
  });
});

describe("listedOptionIdsOf", () => {
  it("reports the chosen ids in the options' order and drops unknown ones", () => {
    expect(listedOptionIdsOf(OPTIONS, ["closed", "gone", "open"])).toEqual(["open", "closed"]);
    expect(listedOptionIdsOf(OPTIONS, [])).toEqual([]);
  });
});

describe("booleanFilterChoicesOf", () => {
  it("offers true then false with the translated yes and no", () => {
    const definition = { id: "paid", label: "Paid", kind: "boolean" } as FilterDefinition;
    const choices = booleanFilterChoicesOf(definition, "en", t);
    expect(choices.map((choice) => choice.value)).toEqual(["true", "false"]);
    expect(choices[0]?.label).toContain("yes");
    expect(choices[1]?.label).toContain("no");
  });

  it("uses the filter's own words", () => {
    const definition = {
      id: "paid",
      label: "Paid",
      kind: "boolean",
      trueLabel: "Settled",
      falseLabel: "Due",
    } as FilterDefinition;
    expect(booleanFilterChoicesOf(definition, "en", t).map((choice) => choice.label)).toEqual([
      "Settled",
      "Due",
    ]);
  });
});
