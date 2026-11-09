/**
 * Stackra file contract:
 * Purpose: unit tests of `rewriteHashImports`: a static import, a type import, an `export … from`, a side-effect import
 *          and a dynamic import become relative paths without the extension; a specifier the resolver cannot answer
 *          stays and is reported; a `#` string that is not an import is left alone.
 * Boundary: test only; a map stands in for the resolver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0091 (amendment of 2026-11-09).
 */
import { describe, expect, it } from "@stackra/testing";

import { rewriteHashImports } from "#node/encore/functions/rewrite-hash-imports.function";

const targets: Record<string, string> = {
  "#core/x": "/m/src/core/x.ts",
  "#modules/orders/y": "/m/src/modules/orders/y.tsx",
  "#stackra/wiring": "/m/.stackra/gen/wiring.ts",
};
const resolve = (specifier: string) => targets[specifier];

describe("rewriteHashImports", () => {
  it("makes every import form relative, without the extension", () => {
    const text = [
      'import { X } from "#core/x";',
      "import type { Y } from '#modules/orders/y';",
      'export { X } from "#core/x";',
      'import "#stackra/wiring";',
      'const lazy = await import("#modules/orders/y");',
    ].join("\n");
    expect(rewriteHashImports(text, "/m/src/modules/orders/actions/a.ts", resolve)).toEqual({
      text: [
        'import { X } from "../../../core/x";',
        "import type { Y } from '../y';",
        'export { X } from "../../../core/x";',
        'import "../../../../.stackra/gen/wiring";',
        'const lazy = await import("../y");',
      ].join("\n"),
      unresolved: [],
    });
  });

  it("starts a path in the same folder with ./", () => {
    expect(
      rewriteHashImports('import { X } from "#core/x";', "/m/src/core/a.ts", resolve).text,
    ).toBe('import { X } from "./x";');
  });

  it("keeps and reports what the resolver cannot answer, and leaves other # strings alone", () => {
    const text = 'import { Z } from "#config/z";\nconst anchor = "#top";';
    expect(rewriteHashImports(text, "/m/src/a.ts", resolve)).toEqual({
      text,
      unresolved: ["#config/z"],
    });
  });
});
