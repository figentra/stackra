/**
 * Stackra file contract:
 * Purpose: unit tests of `formatJson`: two-space indent with every object expanded, an array of scalars on its line
 *          when the whole line fits in 100 columns and one item per line otherwise, empty containers as `[]` and `{}`,
 *          and a final newline, as the repository's formatter lays out a tsconfig.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0091 (amendment of 2026-11-09).
 */
import { describe, expect, it } from "@stackra/testing";

import { formatJson } from "#node/encore/functions/format-json.function";

describe("formatJson", () => {
  it("keeps a short array on its line and breaks a long one, as services/health's tsconfig is laid out", () => {
    const text = formatJson({
      extends: "@stackra/typescript-config/node",
      compilerOptions: {
        paths: {
          "#src/*": ["./src/*", "./src/*.ts", "./src/*.tsx", "./src/*/index.ts"],
          "#stackra/*": [
            "./.stackra/gen/*",
            "./.stackra/gen/*.ts",
            "./.stackra/gen/*.tsx",
            "./.stackra/gen/*/index.ts",
          ],
        },
      },
    });
    expect(text).toBe(
      [
        "{",
        '  "extends": "@stackra/typescript-config/node",',
        '  "compilerOptions": {',
        '    "paths": {',
        '      "#src/*": ["./src/*", "./src/*.ts", "./src/*.tsx", "./src/*/index.ts"],',
        '      "#stackra/*": [',
        '        "./.stackra/gen/*",',
        '        "./.stackra/gen/*.ts",',
        '        "./.stackra/gen/*.tsx",',
        '        "./.stackra/gen/*/index.ts"',
        "      ]",
        "    }",
        "  }",
        "}",
        "",
      ].join("\n"),
    );
  });

  it("prints empty containers and scalars as JSON does", () => {
    expect(formatJson({ a: [], b: {}, c: null, d: 1, e: true })).toBe(
      '{\n  "a": [],\n  "b": {},\n  "c": null,\n  "d": 1,\n  "e": true\n}\n',
    );
  });
});
