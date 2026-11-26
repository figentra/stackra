/**
 * Stackra file contract:
 * Purpose: unit tests of `ensureImport`: names merged, sorted, into an existing import of the source, and a new import
 *          line after the last import when there is none.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { ensureImport } from "#node/feature-scaffold/functions/ensure-import.function";

describe(ensureImport, () => {
  it("merges into an existing import", () => {
    expect(
      ensureImport(
        'import { Str } from "@stackra/validation";\n',
        ["Int", "Str"],
        "@stackra/validation",
      ),
    ).toBe('import { Int, Str } from "@stackra/validation";\n');
  });

  it("adds an import after the last one", () => {
    expect(
      ensureImport(
        'import { Model } from "@stackra/model";\n\nexport class A {}\n',
        ["Str"],
        "@stackra/validation",
      ),
    ).toBe(
      'import { Model } from "@stackra/model";\nimport { Str } from "@stackra/validation";\n\nexport class A {}\n',
    );
  });
});
