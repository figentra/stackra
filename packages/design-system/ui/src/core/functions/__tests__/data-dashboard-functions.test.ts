/**
 * Stackra file contract:
 * Purpose: proves the wave 3b pure functions: search folding, the treemap layout, funnel rows, trends, meter shares,
 *          the import auto-mapping and its required check, rule operators and evaluation, mentions, the Markdown
 *          subset and command filtering.
 * Boundary: pure functions only.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { filterCommands } from "#core/functions/filter-commands.function";
import { funnelRowsOf } from "#core/functions/funnel-rows-of.function";
import { importMappingOf } from "#core/functions/import-mapping-of.function";
import { markdownBlocksOf } from "#core/functions/markdown-blocks-of.function";
import { markdownInlineOf } from "#core/functions/markdown-inline-of.function";
import { mentionQueryOf } from "#core/functions/mention-query-of.function";
import { mentionSegmentsOf } from "#core/functions/mention-segments-of.function";
import { meterSharesOf } from "#core/functions/meter-shares-of.function";
import { normalizeSearchText } from "#core/functions/normalize-search-text.function";
import { ruleMatches } from "#core/functions/rule-matches.function";
import { ruleOperatorsOf } from "#core/functions/rule-operators-of.function";
import { treemapLayoutOf } from "#core/functions/treemap-layout-of.function";
import { trendOf } from "#core/functions/trend-of.function";
import { unmappedRequiredOf } from "#core/functions/unmapped-required-of.function";

describe("normalizeSearchText", () => {
  it("folds case, accents, Arabic diacritics and alef forms", () => {
    expect(normalizeSearchText("Éclair-Box")).toBe("eclairbox");
    expect(normalizeSearchText("إِدارة")).toBe(normalizeSearchText("ادارة"));
  });
});

describe("treemapLayoutOf", () => {
  it("fills the plot exactly with one tile per positive item, largest first", () => {
    const tiles = treemapLayoutOf(
      [
        { key: "a", label: "A", value: 6 },
        { key: "b", label: "B", value: 6 },
        { key: "c", label: "C", value: 4 },
        { key: "d", label: "D", value: 3 },
        { key: "z", label: "Z", value: 0 },
      ],
      1.5,
    );
    expect(tiles.map((tile) => tile.item.key)).toEqual(["a", "b", "c", "d"]);
    const area = tiles.reduce((sum, tile) => sum + tile.width * tile.height, 0);
    expect(area).toBeCloseTo(100 * 100, 5);
    for (const tile of tiles) {
      expect(tile.x + tile.width).toBeLessThanOrEqual(100.0001);
      expect(tile.y + tile.height).toBeLessThanOrEqual(100.0001);
    }
    expect((tiles[0]?.width ?? 0) * (tiles[0]?.height ?? 0)).toBeCloseTo((6 / 19) * 10_000, 5);
  });

  it("draws nothing for an all-zero list", () => {
    expect(treemapLayoutOf([{ key: "a", label: "A", value: 0 }])).toEqual([]);
  });
});

describe("funnelRowsOf", () => {
  it("gives shares of the first step and conversions from the step before", () => {
    const rows = funnelRowsOf([
      { key: "v", label: "Visited", value: 1000 },
      { key: "c", label: "Cart", value: 250 },
      { key: "p", label: "Paid", value: 100 },
    ]);
    expect(rows.map((row) => row.share)).toEqual([1, 0.25, 0.1]);
    expect(rows.map((row) => row.conversion)).toEqual([null, 0.25, 0.4]);
  });
});

describe("trendOf", () => {
  it("colours by the better direction", () => {
    expect(trendOf(0.12)).toEqual({ direction: "up", icon: "trending-up", tone: "success" });
    expect(trendOf(0.12, "down").tone).toBe("danger");
    expect(trendOf(-0.1, "down").tone).toBe("success");
    expect(trendOf(0).direction).toBe("flat");
  });
});

describe("meterSharesOf", () => {
  it("shares the whole and leaves the rest free", () => {
    const { shares, free, total } = meterSharesOf(
      [
        { key: "a", label: "A", value: 30 },
        { key: "b", label: "B", value: 20 },
      ],
      100,
    );
    expect(shares).toEqual([0.3, 0.2]);
    expect(free).toBe(0.5);
    expect(total).toBe(50);
  });
});

describe("import mapping", () => {
  const fields = [
    { key: "email", label: "Email", isRequired: true, aliases: ["e-mail", "البريد"] },
    { key: "name", label: "Full name", isRequired: true },
    { key: "phone", label: "Phone" },
  ];

  it("matches keys, labels and aliases once each and skips the rest", () => {
    expect(importMappingOf(["E-Mail", "Full Name", "Notes", "email"], fields)).toEqual({
      "E-Mail": "email",
      "Full Name": "name",
      Notes: null,
      email: null,
    });
    expect(importMappingOf(["البريد"], fields)).toEqual({ البريد: "email" });
  });

  it("lists the required fields left empty", () => {
    expect(unmappedRequiredOf(fields, { a: "email", b: null }).map((field) => field.key)).toEqual([
      "name",
    ]);
  });
});

describe("rules", () => {
  it("offers operators by type", () => {
    expect(ruleOperatorsOf("number")).toContain("greater");
    expect(ruleOperatorsOf("text")).not.toContain("greater");
  });

  it("evaluates all and any", () => {
    const record = { total: 250, city: "Riyadh", note: "" };
    const all = {
      match: "all" as const,
      conditions: [
        { id: "1", field: "total", operator: "greater" as const, value: "200" },
        { id: "2", field: "city", operator: "equals" as const, value: "riyadh" },
      ],
    };
    expect(ruleMatches(all, record)).toBe(true);
    expect(
      ruleMatches(
        {
          ...all,
          conditions: [
            ...all.conditions,
            { id: "3", field: "note", operator: "is_not_empty", value: "" },
          ],
        },
        record,
      ),
    ).toBe(false);
    expect(
      ruleMatches(
        {
          match: "any",
          conditions: [
            { id: "1", field: "total", operator: "less", value: "10" },
            { id: "2", field: "city", operator: "contains", value: "yad" },
          ],
        },
        record,
      ),
    ).toBe(true);
    expect(ruleMatches({ match: "all", conditions: [] }, record)).toBe(true);
  });
});

describe("mentions", () => {
  const people = [
    { id: "1", name: "Sara" },
    { id: "2", name: "Sara Ali" },
  ];

  it("reads the open mention at the end of a draft, not an e-mail", () => {
    expect(mentionQueryOf("thanks @Sa")).toBe("Sa");
    expect(mentionQueryOf("@")).toBe("");
    expect(mentionQueryOf("mail a@b")).toBeNull();
    expect(mentionQueryOf("@Sara done")).toBeNull();
  });

  it("cuts known mentions out, longest name first", () => {
    const { segments, mentions } = mentionSegmentsOf(
      "@Sara Ali please ask @Sara and x@Sara",
      people,
    );
    expect(segments.map((segment) => segment.text)).toEqual([
      "@Sara Ali",
      " please ask ",
      "@Sara",
      " and x@Sara",
    ]);
    expect(mentions).toEqual(["2", "1"]);
  });
});

describe("markdown", () => {
  it("parses the block subset and keeps HTML literal", () => {
    const blocks = markdownBlocksOf(
      "# Title\n\nHello\nworld\n\n- a\n- b\n\n1. one\n\n> quote\n\n```ts\nconst a = 1;\n```\n<b>x</b>",
    );
    expect(blocks).toEqual([
      { kind: "heading", level: 1, text: "Title" },
      { kind: "paragraph", text: "Hello world" },
      { kind: "list", isOrdered: false, items: ["a", "b"] },
      { kind: "list", isOrdered: true, items: ["one"] },
      { kind: "quote", text: "quote" },
      { kind: "code", language: "ts", code: "const a = 1;" },
      { kind: "paragraph", text: "<b>x</b>" },
    ]);
  });

  it("parses inline marks and drops unsafe links", () => {
    expect(markdownInlineOf("a **b** *c* `d` [e](https://x.io) [f](javascript:alert(1))")).toEqual([
      { kind: "text", text: "a " },
      { kind: "strong", text: "b" },
      { kind: "text", text: " " },
      { kind: "emphasis", text: "c" },
      { kind: "text", text: " " },
      { kind: "code", text: "d" },
      { kind: "text", text: " " },
      { kind: "link", text: "e", href: "https://x.io" },
      { kind: "text", text: " " },
      { kind: "text", text: "f" },
      { kind: "text", text: ")" },
    ]);
  });
});

describe("filterCommands", () => {
  it("keeps commands holding every word and drops empty sections", () => {
    const sections = [
      {
        id: "a",
        title: "Go",
        items: [
          { id: "orders", label: "Orders", keywords: "sales" },
          { id: "inv", label: "Invoices", description: "Billing" },
        ],
      },
      { id: "b", title: "Create", items: [{ id: "new", label: "New product" }] },
    ];
    expect(
      filterCommands(sections, "bill").map((section) => section.items.map((item) => item.id)),
    ).toEqual([["inv"]]);
    expect(filterCommands(sections, "")).toHaveLength(2);
  });
});
