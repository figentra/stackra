/**
 * Stackra file contract:
 * Purpose: unit tests of `checkSemanticSearch`: a `semantic: true` `@Searchable` over a text field whose `@Classify`
 *          data class says `ai: never` is refused (`searchable_semantic_ai_never`) with a fix, also through an own base
 *          model and a dotted path through a relation to an own model; a lexical facet, an `ai: tenant_opt_in` class and
 *          an unclassified field pass; and `generateMember` refuses on it in the full pass.
 * Boundary: test only; pure IR in, refusals out.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0380 (decisions 2 and 3); ADR 0341; STA-1251.
 */
import { describe, expect, it } from "@stackra/testing";

import { checkSemanticSearch } from "#core/functions/check-semantic-search.function";
import { generateMember } from "#core/functions/generate-member.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { FacetUse } from "#core/types/facet-use.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

/** The fixture's `Order` model, the template of every model here. */
const ORDER = COMMERCE_IR.classes.find((candidate) => candidate.name === "Order") as DeclaredClass;

/** A model `name` with `facets` and an optional own base. */
function model(name: string, facets: readonly FacetUse[], base?: string): DeclaredClass {
  return {
    ...ORDER,
    name,
    file: `src/modules/orders/models/${name.toLowerCase()}.model.ts`,
    facets,
    traits: [],
    ...(base === undefined ? {} : { base: { name: base, from: "#x", own: true } }),
  };
}

/** `@Searchable(options)` on a class. */
function searchable(options: Readonly<Record<string, unknown>>): FacetUse {
  return {
    name: "Searchable",
    kind: "searchable",
    target: "class",
    options,
    from: "@stackra/model",
  };
}

/** `@Classify(Class)` on `member`, with the class's `ai` effect. */
function classify(member: string, ai: string): FacetUse {
  return {
    name: "Classify",
    kind: "classify",
    target: "field",
    member,
    options: {
      $class: "NoteDataClass",
      from: "#modules/orders/access/note.data-class",
      dataClass: { key: "note", ai, support: "hidden", search: "no_snippet", export: "labelled" },
    },
    from: "@stackra/model",
  };
}

/** The member with `classes` and the model shapes `shapes`. */
function irOf(classes: readonly DeclaredClass[], shapes: readonly ShapeIR[] = []): MemberIR {
  return {
    ...COMMERCE_IR,
    classes: [...COMMERCE_IR.classes, ...classes],
    shapes: [...COMMERCE_IR.shapes, ...shapes],
  };
}

/** The subjects refused for `ir`. */
function refused(ir: MemberIR): string[] {
  return checkSemanticSearch(ir).map((error) => `${error.code} ${error.subject}`);
}

describe(checkSemanticSearch, () => {
  it("refuses a semantic facet over an ai: never field, with a fix", () => {
    const ir = irOf([
      model("CaseNote", [
        searchable({ text: ["title", "body"], semantic: true }),
        classify("body", "never"),
      ]),
    ]);
    const [error] = checkSemanticSearch(ir);
    expect(refused(ir)).toEqual(["searchable_semantic_ai_never CaseNote.body"]);
    expect(error?.file).toBe("src/modules/orders/models/casenote.model.ts");
    expect(error?.fix).toContain("drop body from the facet's text");
  });

  it("passes a lexical facet, an opt-in class and an unclassified field", () => {
    expect(
      refused(
        irOf([
          model("Lexical", [searchable({ text: ["body"] }), classify("body", "never")]),
          model("OptIn", [
            searchable({ text: ["body"], semantic: true }),
            classify("body", "tenant_opt_in"),
          ]),
          model("Plain", [searchable({ text: ["body"], semantic: true })]),
        ]),
      ),
    ).toEqual([]);
  });

  it("reads a field an own base model classifies", () => {
    const ir = irOf([
      model("BaseNote", [classify("body", "never")]),
      model("Memo", [searchable({ text: ["body"], semantic: true })], "BaseNote"),
    ]);
    expect(refused(ir)).toEqual(["searchable_semantic_ai_never Memo.body"]);
  });

  it("follows a dotted path through a relation to an own model", () => {
    const shape = COMMERCE_IR.shapes[0] as ShapeIR;
    const ir = irOf(
      [
        model("Child", [classify("body", "never")]),
        model("Parent", [searchable({ text: ["child.body"], semantic: true })]),
      ],
      [
        {
          ...shape,
          name: "Parent",
          kind: "model",
          entity: {
            optional: [],
            computed: [],
            relations: [
              {
                name: "child",
                kind: "m:1",
                target: { name: "Child", from: "#modules/orders/models/child.model" },
                nullable: false,
                ref: false,
                options: {},
              },
            ],
          },
        },
      ],
    );
    expect(refused(ir)).toEqual(["searchable_semantic_ai_never Parent.child.body"]);
  });

  it("makes generateMember refuse in the full pass", () => {
    const ir = irOf([
      model("CaseNote", [
        searchable({ text: ["body"], semantic: true }),
        classify("body", "never"),
      ]),
    ]);
    const result = generateMember(ir);
    expect(result.files).toEqual([]);
    expect(result.errors.map((error) => error.code)).toContain("searchable_semantic_ai_never");
  });
});
