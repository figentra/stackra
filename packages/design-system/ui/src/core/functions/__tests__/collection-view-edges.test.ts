/**
 * Stackra file contract:
 * Purpose: proves the collection and navigation helpers' edges: the data view's slots chosen or defaulted, the rule fields of the filterable
 *          columns, the fitted column width within its limits, the current navigation entry for roots, slashes,
 *          queries and absolute URLs, highlight parts around Arabic marks, the stepper's statuses and pressable
 *          steps, the social marks, the filter chip words and wrong-shaped filter values, and the stored values with
 *          no window, no key or a throwing storage.
 * Boundary: pure; stubs `window` for the storage cases and restores it.
 * Runtime: node
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0022 (test placement); STA-1371.
 */
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import type { ResolvedCollectionColumn } from "#contracts/types/resolved-collection-column.type";
import { collectionRuleFieldsOf } from "#core/functions/collection-rule-fields-of.function";
import { dataViewFieldsOf } from "#core/functions/data-view-fields-of.function";
import { filterChipTextOf } from "#core/functions/filter-chip-text-of.function";
import { filterChipWordsOf } from "#core/functions/filter-chip-words-of.function";
import { fitColumnWidth } from "#core/functions/fit-column-width.function";
import { highlightPartsOf } from "#core/functions/highlight-parts-of.function";
import { markCurrentItems } from "#core/functions/mark-current-items.function";
import { readStored } from "#core/functions/read-stored.function";
import { socialMarkOf } from "#core/functions/social-mark-of.function";
import { stepperStatesOf } from "#core/functions/stepper-states-of.function";
import { writeStored } from "#core/functions/write-stored.function";

const column = (
  id: string,
  extra: Partial<ResolvedCollectionColumn> = {},
): ResolvedCollectionColumn => ({
  id,
  label: id.toUpperCase(),
  defaultLabel: id.toUpperCase(),
  isHidden: false,
  canHide: true,
  ...extra,
});
const COLUMNS = [
  column("name"),
  column("email", { isRowHeader: true }),
  column("city"),
  column("total"),
];
const ids = (list: readonly ({ readonly id: string } | undefined)[]) =>
  list.map((item) => item?.id);

describe("dataViewFieldsOf", () => {
  it("defaults the title to the row header and the subtitle to the next column", () => {
    const slots = dataViewFieldsOf(undefined, COLUMNS);
    expect(ids([slots.title, slots.subtitle, slots.meta])).toEqual(["email", "name", undefined]);
    expect(ids(slots.fields)).toEqual(["city", "total"]);
  });

  it("takes the given slots, skipping unknown ids and the meta column as subtitle", () => {
    const slots = dataViewFieldsOf(
      { title: "city", meta: "name", fields: ["total", "gone"] },
      COLUMNS,
    );
    expect(ids([slots.title, slots.subtitle, slots.meta])).toEqual(["city", "email", "name"]);
    expect(ids(slots.fields)).toEqual(["total"]);
    expect(dataViewFieldsOf({ title: "gone", subtitle: "total" }, [column("a")]).title?.id).toBe(
      "a",
    );
    expect(dataViewFieldsOf({ subtitle: "total" }, COLUMNS).subtitle?.id).toBe("total");
  });

  it("has no slots with no columns", () => {
    expect(dataViewFieldsOf(undefined, [])).toEqual({
      title: undefined,
      subtitle: undefined,
      meta: undefined,
      fields: [],
    });
  });
});

/** A storage call that is refused. */
const fail = () => {
  throw new Error("denied");
};

describe("collectionRuleFieldsOf", () => {
  it("offers the filterable columns, typed text by default, with their options", () => {
    const options = [{ id: "paid", label: "Paid" }];
    expect(
      collectionRuleFieldsOf([
        column("name"),
        column("total", { type: "number" }),
        column("status", { type: "choice", options }),
        column("secret", { isFilterable: false }),
      ]),
    ).toEqual([
      { key: "name", label: "NAME", type: "text" },
      { key: "total", label: "TOTAL", type: "number" },
      { key: "status", label: "STATUS", type: "choice", options },
    ]);
  });
});

describe("fitColumnWidth", () => {
  it.each([
    [{ id: "n", label: "N" }, [], 80],
    [{ id: "n", label: "Name" }, [{ id: "1", n: "x".repeat(20) }], 200],
    [{ id: "n", label: "N" }, [{ id: "1", n: "x".repeat(200) }], 640],
    [{ id: "n", label: "N", minWidth: 100 }, [{ id: "1", n: null }], 100],
    [{ id: "n", label: "N", maxWidth: 150 }, [{ id: "1", n: "x".repeat(40) }], 150],
  ])("fits %o to %d", (col, items, width) => {
    expect(fitColumnWidth(col, items)).toBe(width);
  });
});

describe("markCurrentItems", () => {
  const items = [
    { id: "home", label: "Home", href: "/" },
    {
      id: "orders",
      label: "Orders",
      href: "/orders/",
      children: [{ id: "open", label: "Open", href: "/orders/open?tab=1" }],
    },
    { id: "docs", label: "Docs", href: "https://docs.example.com/orders" },
    { id: "group", label: "Group" },
  ];
  const current = (pathname: string) => {
    const flat: string[] = [];
    const walk = (list: ReturnType<typeof markCurrentItems>) => {
      for (const item of list) {
        if (item.isCurrent) flat.push(item.id);
        walk(item.children ?? []);
      }
    };
    walk(markCurrentItems(items, pathname));
    return flat;
  };

  it.each([
    ["/", ["home"]],
    ["//", ["home"]],
    ["/orders", ["orders"]],
    ["/orders/open/ord_1#line", ["open"]],
    ["/settings", []],
    ["https://docs.example.com/orders", []],
  ])("marks %s as %o", (pathname, expected) => {
    expect(current(pathname)).toEqual(expected);
  });
});

describe("highlightPartsOf", () => {
  it("splits around the matches, keeping marks and the text after", () => {
    expect(highlightPartsOf("مُحَمَّد علي", "محمد")).toEqual([
      { text: "مُحَمَّد", isMatch: true },
      { text: " علي", isMatch: false },
    ]);
    expect(highlightPartsOf("Order 12", ["", "der", "  "])).toEqual([
      { text: "Or", isMatch: false },
      { text: "der", isMatch: true },
      { text: " 12", isMatch: false },
    ]);
    expect(highlightPartsOf("", "x")).toEqual([]);
  });
});

describe("stepperStatesOf", () => {
  const steps = [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
    { id: "c", label: "C", status: "error" as const },
  ];

  it("derives statuses from the current step and keeps a given one", () => {
    expect(
      stepperStatesOf(steps, "b", true, true).map((state) => [state.status, state.isPressable]),
    ).toEqual([
      ["complete", true],
      ["current", false],
      ["error", false],
    ]);
    expect(stepperStatesOf(steps, "b", true, false).map((state) => state.isPressable)).toEqual([
      true,
      false,
      true,
    ]);
    expect(stepperStatesOf(steps, "b", false, false).some((state) => state.isPressable)).toBe(
      false,
    );
    expect(stepperStatesOf(steps, "gone", true, true).map((state) => state.status)).toEqual([
      "upcoming",
      "upcoming",
      "error",
    ]);
  });
});

describe("socialMarkOf", () => {
  it("takes the given mark, else the id when it names one", () => {
    expect(socialMarkOf({ id: "google", name: "Google" })).toBe("google");
    expect(socialMarkOf({ id: "sso", name: "SSO", provider: "microsoft" })).toBe("microsoft");
    expect(socialMarkOf({ id: "nafath", name: "Nafath" })).toBeUndefined();
  });
});

describe("filter chip words and wrong-shaped values", () => {
  it("translates each word through the catalogue", () => {
    expect(filterChipWordsOf((key) => `t(${String(key)})`)).toEqual({
      yes: expect.stringContaining("yes"),
      no: expect.stringContaining("no"),
      from: expect.stringContaining("from"),
      until: expect.stringContaining("until"),
    });
  });

  it.each<[FilterDefinition, unknown]>([
    [{ id: "t", label: "T", kind: "text" }, ["a"]],
    [{ id: "s", label: "S", kind: "select", options: [] }, true],
    [{ id: "m", label: "M", kind: "multi-select", options: [] }, "a"],
    [{ id: "n", label: "N", kind: "number" }, "5"],
    [{ id: "d", label: "D", kind: "date-range" }, true],
  ])("writes nothing for %o holding %j", (definition, value) => {
    const words = { yes: "Yes", no: "No", from: "From", until: "Until" };
    expect(filterChipTextOf(definition, value as never, "en", words)).toBe("");
  });
});

describe("readStored and writeStored", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does nothing with no window or no key", () => {
    writeStored("k", "v");
    expect(readStored("k")).toBeUndefined();
    const setItem = vi.fn();
    vi.stubGlobal("window", { localStorage: { getItem: () => "v", setItem } });
    writeStored(undefined, "v");
    expect(readStored(undefined)).toBeUndefined();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("reads and writes the storage, and a missing value as undefined", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
      },
    });
    expect(readStored("k")).toBeUndefined();
    writeStored("k", "v");
    expect(readStored("k")).toBe("v");
  });

  it("swallows a storage that throws", () => {
    vi.stubGlobal("window", { localStorage: { getItem: fail, setItem: fail } });
    expect(() => writeStored("k", "v")).not.toThrow();
    expect(readStored("k")).toBeUndefined();
  });
});
