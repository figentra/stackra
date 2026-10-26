/**
 * Stackra file contract:
 * Purpose: unit tests of `emitI18n`: `#stackra/i18n` with the typed key tree of the base locale (nested objects as
 *          branches, leaves beside children under `_`, `$` notes left out) and the sorted locale list; nothing for a member without
 *          catalogues or without `@stackra/i18n`; and `generateMember` writing `.stackra/gen/i18n.ts`.
 * Boundary: test only; asserts on the generated source text.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0268 (R15); STA-1293.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitI18n } from "#core/functions/emit-i18n.function";
import { generateMember } from "#core/functions/generate-member.function";
import type { MemberIR } from "#core/types/member-ir.type";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

const CATALOGUES: MemberIR["catalogues"] = {
  fr: { carts: { nav: { sales: "Ventes" } } },
  en: {
    carts: {
      nav: { sales: "Sales" },
      enums: { cart_kind: { cart: "Cart", draft_order: "Draft order" } },
      title: "Carts",
      $comment: "a note for translators",
    },
    orders: { title: "Orders" },
  },
  ar: { carts: { nav: { sales: "المبيعات" } } },
};

describe("emitI18n", () => {
  const file = emitI18n({ ...COMMERCE_IR, catalogues: CATALOGUES });
  const content = file?.content ?? "";

  it("writes the key tree of the base locale through keys()", () => {
    expect(file?.path).toBe(".stackra/gen/i18n.ts");
    expect(content).toContain('import { keys } from "@stackra/i18n";');
    expect(content).toContain("export const I18n = keys({");
    expect(content).toContain('"_": [\n      "title"\n    ],');
    expect(content).toContain('"cart_kind": [\n        "cart",\n        "draft_order"\n      ]');
    expect(content).toContain('"orders": [\n    "title"\n  ]');
    expect(content).not.toContain("$comment");
  });

  it("lists the locales, sorted", () => {
    expect(content).toContain('export const locales = ["ar","en","fr"] as const;');
  });

  it("writes nothing without catalogues or without @stackra/i18n", () => {
    expect(emitI18n(COMMERCE_IR)).toBeUndefined();
    expect(
      emitI18n({ ...COMMERCE_IR, catalogues: CATALOGUES, packages: ["@stackra/database"] }),
    ).toBeUndefined();
    expect(
      emitI18n({ ...COMMERCE_IR, catalogues: CATALOGUES, packages: ["@stackra/i18n"] }),
    ).toBeDefined();
  });

  it("is written by generateMember", () => {
    const { files, errors } = generateMember({ ...COMMERCE_IR, catalogues: CATALOGUES });
    expect(errors).toEqual([]);
    expect(files.map((written) => written.path)).toContain(".stackra/gen/i18n.ts");
  });
});
