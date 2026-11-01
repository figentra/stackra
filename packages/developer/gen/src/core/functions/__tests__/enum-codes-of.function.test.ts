/**
 * Stackra file contract:
 * Purpose: unit tests of `enumCodesOf`: plain and `[code, meta]` cases in order, comments and quoted keys skipped, a
 *          meta object's strings never read as codes, and undefined for a file without the enum.
 * Boundary: test only; pure strings.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1663.
 */
import { describe, expect, it } from "@stackra/testing";

import { enumCodesOf } from "#core/functions/enum-codes-of.function";

describe("enumCodesOf", () => {
  it("reads plain and paired cases in declaration order, past comments and meta", () => {
    const text = [
      'import { Enum } from "@stackra/contracts";',
      "",
      "export const SetupSeedKind = Enum.of({",
      '  /** A reason code: the label\'s "quote" is no code. */',
      '  ReasonCode: "reason_code",',
      '  // RolePreset: "not_this",',
      '  RolePreset: ["role_preset", { label: "Role: preset", tags: ["a", "b"] }],',
      '  "Checklist": `checklist_step`,',
      "});",
      "",
      "export type SetupSeedKind = Enum.Value<typeof SetupSeedKind>;",
    ].join("\n");
    expect(enumCodesOf(text, "SetupSeedKind")).toEqual([
      "reason_code",
      "role_preset",
      "checklist_step",
    ]);
  });

  it("is undefined when the file declares no such enum", () => {
    expect(enumCodesOf('export type SetupSeedKind = "a" | "b";', "SetupSeedKind")).toBeUndefined();
  });
});
