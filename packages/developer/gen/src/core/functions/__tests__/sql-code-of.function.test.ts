/**
 * Stackra file contract:
 * Purpose: unit tests of `sqlCodeOf`: line and block comments (nested too) become a space, single-quoted literals
 *          (`E''` escapes included) become `''`, quoted identifiers are masked so no keyword reads inside one, and
 *          dollar-quoted bodies are blanked unless kept; a comment marker inside a literal or a body is not a comment.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decision 3); STA-2866.
 */
import { describe, expect, it } from "@stackra/testing";

import { sqlCodeOf } from "#core/functions/sql-code-of.function";

describe("sqlCodeOf", () => {
  it("drops line and block comments, nested ones too", () => {
    expect(sqlCodeOf("a -- not valid\nb")).toBe("a  b");
    expect(sqlCodeOf("a /* x /* y */ not valid */ b")).toBe("a   b");
  });

  it("blanks literals, E'' escapes and doubled quotes included", () => {
    expect(sqlCodeOf("x = 'it''s -- here'")).toBe("x = ''");
    expect(sqlCodeOf("x = E'\\'', f(), 'y'")).toBe("x = E'', f(), ''");
  });

  it("masks a quoted identifier so no keyword reads inside it", () => {
    expect(sqlCodeOf('add column "not valid"')).toBe(
      'add column "000006e00006f00007400002000007600006100006c000069000064"',
    );
    expect(sqlCodeOf('"a""b"')).toBe('"0000061000022000062"');
  });

  it("masks a name outside the basic plane by code point", () => {
    expect(sqlCodeOf('"\u{1F600}"')).toBe('"001f600"');
  });

  it("blanks a dollar-quoted body unless asked to keep it", () => {
    expect(sqlCodeOf("do $b$ delete -- x\n $b$")).toBe("do $$");
    expect(sqlCodeOf("do $b$ delete -- x\n $b$ -- y", true)).toBe("do $b$ delete -- x\n $b$  ");
  });
});
