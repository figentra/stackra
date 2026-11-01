/**
 * Stackra file contract:
 * Purpose: unit tests of `hookDiagnosticFinding`, the mapping of an oxlint diagnostic to a `hooks` finding.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0305 (rule 41); ADR 0022 (test placement).
 */
import { describe, expect, it } from "vitest";

import { HOOKS_PHASE } from "#node/constants/hooks-phase.constant";
import { hookDiagnosticFinding } from "#node/functions/hook-diagnostic-finding.function";

describe("hookDiagnosticFinding", () => {
  it("places the oxlint message at the source path and line, with no column", () => {
    expect(
      hookDiagnosticFinding(
        HOOKS_PHASE,
        { message: "React Hook is called conditionally", labels: [{ span: { line: 7 } }] },
        "src/components/a/a.tsx",
      ),
    ).toEqual(
      expect.objectContaining({
        phase: "hooks",
        tool: "oxlint",
        rule: "rules-of-hooks",
        path: "src/components/a/a.tsx",
        line: 7,
        column: null,
        severity: "error",
        message: "React Hook is called conditionally",
        adr: "0305",
      }),
    );
  });

  it("leaves the line empty when oxlint gives no label", () => {
    expect(hookDiagnosticFinding(HOOKS_PHASE, { message: "m" }, "a.tsx").line).toBeNull();
  });
});
