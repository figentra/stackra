/**
 * Stackra file contract:
 * Purpose: unit tests of `emitBlueprintMacros`: no file for no macro; one `Blueprint` member per macro, named as the
 *          compiler installs it, typed from `apply`, sorted by class name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 as amended by ADR 0305.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitBlueprintMacros } from "#core/functions/emit-blueprint-macros.function";

describe("emitBlueprintMacros", () => {
  it("writes nothing for no macro", () => {
    expect(emitBlueprintMacros([])).toEqual([]);
  });

  it("declares one member per macro, sorted, typed from apply", () => {
    const [file] = emitBlueprintMacros([
      { name: "RetentionMacro", from: "#modules/compliance/database/macros/retention.macro" },
      { name: "AuditStampMacro", from: "#modules/compliance/database/macros/audit-stamp.macro" },
    ]);
    expect(file?.path).toBe(".stackra/gen/blueprint.ts");
    const content = file?.content ?? "";
    expect(content).toContain(
      'import type { RetentionMacro } from "#modules/compliance/database/macros/retention.macro";',
    );
    expect(content).toContain(
      "    retention: (...args: MacroArgs<RetentionMacro>) => ColumnGroup;",
    );
    expect(content.indexOf("auditStamp:")).toBeLessThan(content.indexOf("retention:"));
    expect(content).toContain('declare module "@stackra/database"');
  });
});
