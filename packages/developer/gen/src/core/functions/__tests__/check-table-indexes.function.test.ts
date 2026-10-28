/**
 * Stackra file contract:
 * Purpose: unit tests of `checkTableIndexes`: a recorded resource table that sorts (a sortable column, the default sort,
 *          a tiebreak key) or filters on a path no index leads with is refused (`sort_not_indexed`,
 *          `filter_not_indexed`) with a fix; an `@Index` leading column, a `@Searchable` filter, the primary key, an own
 *          base model's index, a relation path and the trashed filter pass; no recorded tree means no refusal; and
 *          `generateMember` refuses on it in the full pass.
 * Boundary: test only; pure IR in, refusals out.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 2); reporting gap 5.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { checkTableIndexes } from "#core/functions/check-table-indexes.function";
import { generateMember } from "#core/functions/generate-member.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { FacetUse } from "#core/types/facet-use.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

/** The fixture's `Order` model, the template of every model here. */
const ORDER = COMMERCE_IR.classes.find((candidate) => candidate.name === "Order") as DeclaredClass;

/** A model `name` in the orders module with `facets` and an optional own base. */
function model(name: string, facets: readonly FacetUse[], base?: string): DeclaredClass {
  return {
    ...ORDER,
    name,
    file: `src/modules/orders/models/${name.toLowerCase()}.model.ts`,
    facets,
    ...(base === undefined ? {} : { base: { name: base, from: "#x", own: true } }),
  };
}

/** A class facet `name(options)`. */
function facet(name: string, options: unknown): FacetUse {
  return { name, kind: name.toLowerCase(), target: "class", options, from: "@stackra/model" };
}

/** The member with `classes` added. */
function irOf(classes: readonly DeclaredClass[], shapes: readonly ShapeIR[] = []): MemberIR {
  return {
    ...COMMERCE_IR,
    classes: [...COMMERCE_IR.classes, ...classes],
    shapes: [...COMMERCE_IR.shapes, ...shapes],
  };
}

/** A committed manifest recording `table` for `key`. */
function recorded(key: string, table: unknown): StackraManifest {
  return { ui: { resources: { [key]: { options: {}, table } } } } as unknown as StackraManifest;
}

const TABLE = {
  columns: [
    { kind: "value", key: "total", sortable: true },
    { kind: "value", key: "status", sortable: true },
    { kind: "value", key: "note" },
  ],
  filters: [
    { kind: "value", key: "status" },
    { kind: "dateRange", key: "placedAt" },
    { kind: "value", key: "customer.name" },
    { kind: "trashed" },
  ],
  defaultSort: { key: "id", direction: "desc" },
  thenSort: [{ key: "rank", direction: "asc" }],
  count: "estimated",
};

/** The `code subject` lines refused for `ir` and `previous`. */
function refused(ir: MemberIR, previous?: StackraManifest): string[] {
  return checkTableIndexes(ir, previous).map((error) => `${error.code} ${error.subject}`);
}

const CUSTOMER_SHAPE: ShapeIR = {
  ...(COMMERCE_IR.shapes[0] as ShapeIR),
  name: "Ledger",
  kind: "model",
  entity: {
    optional: [],
    computed: [],
    relations: [
      {
        name: "customer",
        kind: "m:1",
        target: { name: "Customer", from: "#modules/orders/models/customer.model" },
        nullable: false,
        ref: false,
        options: {},
      },
    ],
  },
};

describe(checkTableIndexes, () => {
  it("refuses an unindexed sort, tiebreak and filter path, with a fix", () => {
    const ir = irOf([model("Ledger", [facet("Index", ["status", "total"])])], [CUSTOMER_SHAPE]);
    expect(refused(ir, recorded("orders.ledger", TABLE))).toEqual([
      "sort_not_indexed orders.ledger.table.sort.total",
      "sort_not_indexed orders.ledger.table.sort.rank",
      "filter_not_indexed orders.ledger.table.filter.placedAt",
    ]);
    const [error] = checkTableIndexes(ir, recorded("orders.ledger", TABLE));
    expect(error?.file).toBe("src/modules/orders/models/ledger.model.ts");
    expect(error?.fix).toContain('add @Index(["total"]) to Ledger');
  });

  it("passes leading index columns, searchable filters and an own base model's index", () => {
    const ir = irOf(
      [
        model("BaseLedger", [facet("Index", ["total"]), facet("Index", ["rank", "id"])]),
        model(
          "Ledger",
          [facet("Index", ["status"]), facet("Searchable", { text: [], filters: ["placedAt"] })],
          "BaseLedger",
        ),
      ],
      [CUSTOMER_SHAPE],
    );
    expect(refused(ir, recorded("orders.ledger", TABLE))).toEqual([]);
  });

  it("checks nothing without a recorded tree", () => {
    const ir = irOf([model("Ledger", [])]);
    expect(refused(ir)).toEqual([]);
    expect(refused(ir, recorded("orders.other", TABLE))).toEqual([]);
  });

  it("makes generateMember refuse in the full pass", () => {
    const ir = irOf([model("Ledger", [])], [CUSTOMER_SHAPE]);
    const { manifest } = generateMember(ir);
    const result = generateMember(ir, {
      ...manifest,
      ui: { resources: { "orders.ledger": { options: {}, table: TABLE } } },
    } as StackraManifest);
    expect(result.files).toEqual([]);
    expect(result.errors.map((error) => error.code)).toContain("sort_not_indexed");
  });
});
