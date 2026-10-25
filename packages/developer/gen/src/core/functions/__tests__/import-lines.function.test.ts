/**
 * Stackra file contract:
 * Purpose: unit tests of `importLines`: one sorted line per specifier, names sorted, `import type` when every name is
 *          a type, inline `type` otherwise, empty specifiers skipped.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 26: stable output).
 */
import { describe, expect, it } from "@stackra/testing";

import { importLines } from "#core/functions/import-lines.function";

describe("importLines", () => {
  it("prints a stable import block", () => {
    const imports = new Map([
      ["zod", new Map([["z", false]])],
      [
        "@stackra/validation",
        new Map([
          ["registerSchemas", false],
          ["Assert", true],
        ]),
      ],
      ["@stackra/contracts", new Map([["Email", true]])],
      ["unused", new Map<string, boolean>()],
    ]);
    expect(importLines(imports)).toEqual([
      'import type { Email } from "@stackra/contracts";',
      'import { type Assert, registerSchemas } from "@stackra/validation";',
      'import { z } from "zod";',
    ]);
  });
});
