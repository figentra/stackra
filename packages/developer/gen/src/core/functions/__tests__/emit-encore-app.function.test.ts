/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEncoreApp`: the app file sits at `.stackra/encore/encore.app` and holds the given id
 *          with `lang: typescript`, as JSON Encore reads.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0091 (decision 2); STA-1322.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitEncoreApp } from "#core/functions/emit-encore-app.function";

describe("emitEncoreApp", () => {
  it("writes the runway's app id with lang typescript", () => {
    const file = emitEncoreApp("figentra-commerce");
    expect(file.path).toBe(".stackra/encore/encore.app");
    expect(JSON.parse(file.content)).toEqual({ id: "figentra-commerce", lang: "typescript" });
    expect(file.content.endsWith("}\n")).toBe(true);
  });
});
