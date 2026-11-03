/**
 * Stackra file contract:
 * Purpose: unit tests of `emitI18n`: `#stackra/i18n` with the typed key tree of the base locale (nested objects as
 *          branches, leaves beside children under `_`, `$` notes left out) and the sorted locale list; nothing for a member without
 *          catalogues or without `@stackra/i18n`; a declared package's namespace merged into `I18n` (STA-1298); and
 *          `generateMember` writing `.stackra/gen/i18n.ts`; the catalogue loaders and `loadMessages` (STA-1309); a consumed
 *          service's namespace loaded from its folder relative to the member (STA-1363); `prefixes` from the host's
 *          I18nConfig override, the base defaults filling each field it leaves out (STA-2065).
 * Boundary: test only; asserts on the generated source text.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0268 (R15); ADR 0297 (decision 4); STA-1293; STA-1298; STA-1309;
 *                     STA-1363; STA-2065.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitI18n } from "#core/functions/emit-i18n.function";
import { generateMember } from "#core/functions/generate-member.function";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";
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

/** The host's I18nConfig override, setting each field of `defaults` (enum cases already read as wire values). */
const i18nConfig = (defaults: Readonly<Record<string, unknown>>): ShapeIR => ({
  name: "I18nConfig",
  kind: "config",
  module: "commerce",
  file: "src/config/i18n.config.ts",
  importPath: "#config/i18n.config",
  base: { kind: "package", name: "I18nConfig", from: "@stackra/i18n" },
  fields: Object.entries(defaults).map(([name, value]) => ({
    name,
    optional: false,
    nullable: false,
    type: { kind: "json" },
    rules: [],
    default: { value, code: JSON.stringify(value), imports: [] },
  })),
  relations: [],
});

/** The `prefixes` line `emitI18n` writes for the member with `defaults` in its I18nConfig override, if any. */
const prefixesOf = (defaults?: Readonly<Record<string, unknown>>): string | undefined =>
  emitI18n({
    ...COMMERCE_IR,
    catalogues: CATALOGUES,
    shapes: [...COMMERCE_IR.shapes, ...(defaults === undefined ? [] : [i18nConfig(defaults)])],
  })
    ?.content.split("\n")
    .find((line) => line.startsWith("export const prefixes = "));

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

  it("loads a consumed service's namespace from its folder, relative to the member (STA-1363)", () => {
    const merged =
      emitI18n({
        ...COMMERCE_IR,
        packageCatalogues: [
          {
            package: "@acme/service-commerce",
            from: "../../services/commerce/assets/lang",
            catalogues: { en: { orders: { title: "Orders" } } },
          },
        ],
      })?.content ?? "";
    expect(merged).toContain('"orders": [\n    "title"\n  ]');
    expect(merged).toContain(
      '"orders": {\n    "en": () => import("../../../../services/commerce/assets/lang/en/orders.json", { with: { type: "json" } }),',
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
    // The orders namespace carries OrderStatus's derived labels, which checkI18n requires (STA-1306).
    const labelled: MemberIR["catalogues"] = {
      ...CATALOGUES,
      en: {
        ...CATALOGUES?.["en"],
        orders: {
          title: "Orders",
          enums: { order_status: { pending: "Pending", paid: "Paid", cancelled: "Cancelled" } },
        },
      },
    };
    const { files, errors } = generateMember({ ...COMMERCE_IR, catalogues: labelled });
    expect(errors).toEqual([]);
    expect(files.map((written) => written.path)).toContain(".stackra/gen/i18n.ts");
  });

  describe("prefixes (STA-2065)", () => {
    it("writes each configured locale's prefix, the default unprefixed, in the configured order", () => {
      expect(prefixesOf({ locales: ["en", "ar-SA"] })).toBe(
        'export const prefixes = {"en":"","ar-SA":"/ar-sa"} as const;',
      );
    });

    it("prefixes the default locale too under the prefix strategy", () => {
      expect(prefixesOf({ locales: ["en", "ar-SA"], urlStrategy: "prefix" })).toBe(
        'export const prefixes = {"en":"/en","ar-SA":"/ar-sa"} as const;',
      );
    });

    it("leaves another default locale unprefixed", () => {
      expect(prefixesOf({ locales: ["en", "ar"], defaultLocale: "ar" })).toBe(
        'export const prefixes = {"en":"/en","ar":""} as const;',
      );
    });

    it("lowercases a regional tag whole and keeps the key in BCP 47 case", () => {
      expect(prefixesOf({ locales: ["en", "en-US"] })).toBe(
        'export const prefixes = {"en":"","en-US":"/en-us"} as const;',
      );
    });

    it("writes the base config's prefixes without an override, keeping locales from the folders", () => {
      expect(prefixesOf()).toBe('export const prefixes = {"en":""} as const;');
      expect(content).toContain('export const locales = ["ar","en","fr"] as const;');
    });

    it("takes the base default for a field of the wrong type", () => {
      expect(prefixesOf({ locales: "en", defaultLocale: 1, urlStrategy: ["prefix"] })).toBe(
        'export const prefixes = {"en":""} as const;',
      );
    });

    it("gives a default locale outside the configured ones no entry", () => {
      expect(prefixesOf({ locales: ["ar", "ar-SA"], defaultLocale: "en" })).toBe(
        'export const prefixes = {"ar":"/ar","ar-SA":"/ar-sa"} as const;',
      );
    });

    it("writes every prefix as an empty string or a lowercase segment toRoot accepts", () => {
      const line =
        prefixesOf({ locales: ["en", "ar", "ar-SA", "en-US"], urlStrategy: "prefix" }) ?? "";
      const values = Object.values(
        JSON.parse(line.slice("export const prefixes = ".length, -" as const;".length)) as Record<
          string,
          string
        >,
      );
      expect(values).toEqual(["/en", "/ar", "/ar-sa", "/en-us"]);
      for (const value of values) expect(value).toMatch(/^\/[a-z0-9-]+$/);
    });

    it("still writes no file without a namespace or without @stackra/i18n", () => {
      const shapes = [...COMMERCE_IR.shapes, i18nConfig({ locales: ["en", "ar-SA"] })];
      expect(emitI18n({ ...COMMERCE_IR, shapes })).toBeUndefined();
      expect(
        emitI18n({
          ...COMMERCE_IR,
          shapes,
          catalogues: CATALOGUES,
          packages: ["@stackra/database"],
        }),
      ).toBeUndefined();
    });
  });
});
