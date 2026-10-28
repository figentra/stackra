/**
 * Stackra file contract:
 * Purpose: unit tests of `formatJson`: the expected strings are oxfmt 0.71's own output for the same values (read
 *          with `oxfmt --stdin-filepath=x.json`), so gen's committed JSON passes `oxfmt --check`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 10).
 */
import { describe, expect, it } from "@stackra/testing";

import { formatJson } from "#core/functions/format-json.function";

describe("formatJson", () => {
  it("prints short arrays on one line and every non-empty object broken", () => {
    expect(
      formatJson({
        runtimes: ["node", "browser"],
        empty: [],
        none: {},
        mixed: [true, null, 1.5, -1],
        nested: [["a"], ["c", "d"]],
        withEmpty: [{}, "x"],
        objects: [{ a: 1 }],
        dropped: undefined,
      }),
    ).toBe(
      [
        "{",
        '  "runtimes": ["node", "browser"],',
        '  "empty": [],',
        '  "none": {},',
        '  "mixed": [true, null, 1.5, -1],',
        '  "nested": [["a"], ["c", "d"]],',
        '  "withEmpty": [{}, "x"],',
        '  "objects": [',
        "    {",
        '      "a": 1',
        "    }",
        "  ]",
        "}",
        "",
      ].join("\n"),
    );
  });

  it("breaks two or more arrays of two or more items", () => {
    expect(
      formatJson({
        pairs: [
          ["a", "b"],
          ["c", "d"],
        ],
      }),
    ).toBe('{\n  "pairs": [\n    ["a", "b"],\n    ["c", "d"]\n  ]\n}\n');
  });

  it("keeps an array flat at exactly 100 columns, counting the comma after it", () => {
    const fits = "a".repeat(88);
    const over = "a".repeat(89);
    expect(formatJson({ k: [fits], l: [over], n: [over] })).toBe(
      `{\n  "k": ["${fits}"],\n  "l": [\n    "${over}"\n  ],\n  "n": ["${over}"]\n}\n`,
    );
  });

  it("never breaks a long string value after its key", () => {
    const text = "word ".repeat(30).trim();
    expect(formatJson({ $comment: text })).toBe(`{\n  "$comment": "${text}"\n}\n`);
  });

  it("packs a long array of numbers as many per line as fit", () => {
    const numbers = Array.from({ length: 35 }, (_, index) => index + 1);
    expect(formatJson({ k: numbers })).toBe(
      [
        "{",
        '  "k": [',
        `    ${numbers.slice(0, 26).join(", ")},`,
        `    ${numbers.slice(26).join(", ")}`,
        "  ]",
        "}",
        "",
      ].join("\n"),
    );
  });
});
