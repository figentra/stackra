/**
 * Stackra file contract:
 * Purpose: unit tests of `emitI18n`: `#stackra/i18n` with the typed key tree of the base locale (nested objects as
 *          branches, leaves beside children under `_`, `$` notes left out) and the sorted locale list; nothing for a member without
 *          catalogues or without `@stackra/i18n`; a declared package's namespace merged into `I18n` (STA-1298); and
 *          `generateMember` writing `.stackra/gen/i18n.ts`; the catalogue loaders and `loadMessages` (STA-1309).
 * Boundary: test only; asserts on the generated source text.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0268 (R15); STA-1293; STA-1298; STA-1309.
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
    expect(content).toContain('import { keys, loadMessages as load } from "@stackra/i18n";');
    expect(content).toContain("export const I18n = keys({");
    expect(content).toContain('"_": [\n      "title"\n    ],');
    expect(content).toContain('"cart_kind": [\n        "cart",\n        "draft_order"\n      ]');
    expect(content).toContain('"orders": [\n    "title"\n  ]');
    expect(content).not.toContain("$comment");
  });

  it("writes a loader per namespace and locale file, and loadMessages over them (STA-1309)", () => {
    expect(content).toContain(
      '"carts": {\n    "ar": () => import("../../assets/lang/ar/carts.json", { with: { type: "json" } }),',
    );
    expect(content).toContain(
      '"fr": () => import("../../assets/lang/fr/carts.json", { with: { type: "json" } }),',
    );
    // orders ships only in en: a locale without a file has no loader.
    expect(content).toContain(
      '"orders": {\n    "en": () => import("../../assets/lang/en/orders.json", { with: { type: "json" } }),\n  },',
    );
    expect(content).toContain(
      "export const loadMessages = (locale: string) => load(catalogues, locale);",
    );
  });

  it("loads a package's namespace through its ./assets/* export (STA-1309)", () => {
    const merged =
      emitI18n({
        ...COMMERCE_IR,
        packageCatalogues: [
          { package: "@stackra/rules", catalogues: { en: { rules: { title: "Rules" } } } },
        ],
      })?.content ?? "";
    expect(merged).toContain(
      '"rules": {\n    "en": () => import("@stackra/rules/assets/lang/en/rules.json", { with: { type: "json" } }),',
    );
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

  it("merges a declared package's namespaces, keeping the member's locales", () => {
    const merged =
      emitI18n({
        ...COMMERCE_IR,
        catalogues: CATALOGUES,
        packageCatalogues: [
          {
            package: "@stackra/loyalty-kit",
            catalogues: { en: { loyalty_kit: { enums: { loyalty_tier: { gold: "Gold" } } } } },
          },
        ],
      })?.content ?? "";
    expect(merged).toContain(
      '"loyalty_kit": {\n    "enums": {\n      "loyalty_tier": [\n        "gold"',
    );
    // The header wraps its `from` line, so "the" may end the line before.
    expect(merged).toContain("assets/lang of @stackra/loyalty-kit");
    expect(merged).toContain('export const locales = ["ar","en","fr"] as const;');
  });

  it("writes the packages' namespaces for a member without catalogues of its own", () => {
    const only = emitI18n({
      ...COMMERCE_IR,
      packageCatalogues: [
        { package: "@stackra/rules", catalogues: { en: { rules: { title: "Rules" } } } },
      ],
    });
    expect(only?.content).toContain('"rules": [\n    "title"\n  ]');
    expect(only?.content).toContain("export const locales = [] as const;");
  });

  it("is written by generateMember", () => {
    const { files, errors } = generateMember({ ...COMMERCE_IR, catalogues: CATALOGUES });
    expect(errors).toEqual([]);
    expect(files.map((written) => written.path)).toContain(".stackra/gen/i18n.ts");
  });
});
