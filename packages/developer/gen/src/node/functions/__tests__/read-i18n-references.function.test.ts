/**
 * Stackra file contract:
 * Purpose: unit tests of `readI18nReferences`: every `I18n.<namespace>.<path>` chain of a file importing
 *          `#stackra/i18n` (tests included) with its place, a chain cut at an index, comment lines and files without the
 *          import skipped, and generated or installed folders never read.
 * Boundary: test only; writes small fixtures under `.cache/`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0268 (R15); STA-1298.
 */
import { describe, expect, it } from "@stackra/testing";

import { readI18nReferences } from "#node/functions/read-i18n-references.function";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

describe("readI18nReferences", () => {
  it("reads each chain of a file importing #stackra/i18n", () => {
    const root = writeFixtureMember("customers", {
      "src/modules/loyalty/pass.ts": [
        'import { I18n } from "#stackra/i18n";',
        "// I18n.commented.out",
        "export const label = { a: I18n.loyalty.card.tier, b: I18n.loyalty_kit.enums.loyalty_tier[tier] };",
      ].join("\n"),
      "src/modules/loyalty/__tests__/pass.test.ts":
        'import { I18n } from "#stackra/i18n";\nexpect(x).toBe(I18n.loyalty.card.tier);\n',
      "src/other.ts": "const I18n = { a: { b: 1 } };\nexport const x = I18n.a.b;\n",
      ".stackra/gen/i18n.ts": 'import "#stackra/i18n";\nI18n.generated.key;\n',
    });
    expect(readI18nReferences(root)).toEqual([
      {
        file: "src/modules/loyalty/__tests__/pass.test.ts",
        line: 2,
        column: 16,
        path: ["loyalty", "card", "tier"],
      },
      {
        file: "src/modules/loyalty/pass.ts",
        line: 3,
        column: 27,
        path: ["loyalty", "card", "tier"],
      },
      {
        file: "src/modules/loyalty/pass.ts",
        line: 3,
        column: 54,
        path: ["loyalty_kit", "enums", "loyalty_tier"],
      },
    ]);
  });
});
