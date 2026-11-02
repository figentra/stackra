/**
 * Stackra file contract:
 * Purpose: proves `displayWidth`, `isolateBidi`, `padTo` and `renderTable` measure and align Arabic, CJK, emoji,
 *          combining marks and coloured text by display columns, and isolate right-to-left runs without reordering.
 * Boundary: unit test.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-026 and SC-004; ADR 0022 (test placement).
 */
// @covers sta-1730:FR-026 sta-1730:SC-004
import { createPainter } from "#core/functions/create-painter.function";
import { displayWidth } from "#core/functions/display-width.function";
import { isolateBidi } from "#core/functions/isolate-bidi.function";
import { padTo } from "#core/functions/pad-to.function";
import { renderTable } from "#core/functions/render-table.function";

describe("displayWidth", () => {
  it.each([
    ["abc", 3],
    ["مرحبا", 5],
    ["日本", 4],
    ["👍🏽", 2],
    ["⚠", 1],
    ["⚠\uFE0F", 2],
    ["✓ ok", 4],
    ["✗", 1],
    ["é", 1],
    ["\u001B[31mred\u001B[39m", 3],
    ["⁨سلام⁩", 4],
  ])("measures %j as %i columns", (text, width) => {
    expect(displayWidth(text)).toBe(width);
  });
});

describe("isolateBidi", () => {
  it("wraps each right-to-left run and keeps the characters in order", () => {
    expect(isolateBidi("Tenant: شركة الأمل 2, ok")).toBe("Tenant: ⁨شركة الأمل⁩ 2, ok");
    expect(isolateBidi("plain")).toBe("plain");
  });

  it("is idempotent", () => {
    const once = isolateBidi("اسم");
    expect(isolateBidi(once)).toBe(once);
  });
});

describe("padTo", () => {
  it("pads by display width", () => {
    expect(padTo("日本", 5)).toBe("日本 ");
    expect(padTo("ab", 4, "end")).toBe("  ab");
  });
});

describe("renderTable", () => {
  it("renders every row of Arabic and English cells at the same display width", () => {
    const lines = renderTable(
      {
        columns: [
          { header: "Name", key: "name" },
          { header: "City", key: "city" },
        ],
        rows: [
          { name: "شركة الأمل", city: "Riyadh" },
          { name: "Acme", city: "الرياض" },
          { name: "日本商事", city: "Tokyo" },
        ],
      },
      { unicode: true, painter: createPainter(0, "#647384"), columns: 80 },
    );
    // Every second cell starts at the same column: gutter 2, first column 10, gap 3.
    const rows = [
      ["شركة الأمل", "Riyadh"],
      ["Acme", "الرياض"],
      ["日本商事", "Tokyo"],
    ];
    lines.slice(2).forEach((line, index) => {
      expect(displayWidth(line) - displayWidth(rows[index]?.[1] ?? "")).toBe(15);
    });
  });
});
