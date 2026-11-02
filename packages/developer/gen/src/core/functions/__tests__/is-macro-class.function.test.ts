/**
 * Stackra file contract:
 * Purpose: unit tests of `isMacroClass` and `macroHint`: a macro is recognised whichever copy of the `Macro` base it
 *          extends (two peer-variant copies of `@stackra/database`, STA-2006), and a class without `apply` or without
 *          the base is not; a compile error from a missing blueprint method names the macros gen collected.
 * Boundary: test only; the two copies are two separately declared `Macro` classes, as two package copies would load.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159; STA-2006.
 */
import { describe, expect, it } from "@stackra/testing";

import { isMacroClass } from "#core/functions/is-macro-class.function";
import { macroHint } from "#core/functions/macro-hint.function";

/** One copy of `@stackra/database`'s `Macro` base, as each peer-variant copy declares its own. */
const copyOf = () =>
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: stands in for the abstract kind base, which holds nothing at runtime
  class Macro {};

const FirstCopy = copyOf();
const SecondCopy = copyOf();

class SoftDeleteMacro extends FirstCopy {
  apply(): string {
    return "deleted_at";
  }
}

class DataClassificationMacro extends SecondCopy {
  apply(): string {
    return "data_classification";
  }
}

/** A subclass of a subclass still reaches the base. */
class AuditedSoftDeleteMacro extends SoftDeleteMacro {}

describe("isMacroClass", () => {
  it("recognises a macro of either copy of the base, and a macro's subclass", () => {
    expect(SoftDeleteMacro.prototype instanceof SecondCopy).toBe(false);
    expect(isMacroClass(SoftDeleteMacro)).toBe(true);
    expect(isMacroClass(DataClassificationMacro)).toBe(true);
    expect(isMacroClass(AuditedSoftDeleteMacro)).toBe(true);
  });

  it("refuses the base itself, a class without the base, and anything that is not a class", () => {
    expect(isMacroClass(FirstCopy)).toBe(false);
    // oxlint-disable-next-line typescript/no-extraneous-class -- reason: a class with `apply` but no Macro base
    class Lookalike {
      apply(): string {
        return "";
      }
    }
    expect(isMacroClass(Lookalike)).toBe(false);
    expect(isMacroClass({ apply: () => "" })).toBe(false);
    expect(isMacroClass(undefined)).toBe(false);
  });
});

describe("macroHint", () => {
  it("names the macros collected when a blueprint method is missing", () => {
    expect(macroHint("t.belongsToTenant is not a function", [DataClassificationMacro])).toContain(
      "no macro supplied `t.belongsToTenant`; gen collected DataClassificationMacro.",
    );
    expect(macroHint("t.belongsToTenant is not a function", [])).toContain(
      "gen collected no macro.",
    );
  });

  it("adds nothing to any other compile error", () => {
    expect(macroHint("column `id` is declared twice", [DataClassificationMacro])).toBe("");
  });
});
