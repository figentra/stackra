/**
 * Stackra file contract:
 * Purpose: unit tests of `checkI18n` and `i18nTree`: a declared package's namespace merged beside the member's, a key
 *          reference found in either (a branch or a leaf), `i18n_key_missing` for a key or namespace no catalogue ships,
 *          `i18n_namespace_clash` for a namespace shipped twice, nothing checked without `@stackra/i18n`, and
 *          `generateMember` refusing on either code; a derived enum label `<module>::enums.<enum>.<code>` missing from a
 *          base-language locale (STA-1306).
 * Boundary: test only; pure IR in, refusals out.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0268 (R15); STA-1298.
 */
import { describe, expect, it } from "@stackra/testing";

import { checkI18n } from "#core/functions/check-i18n.function";
import { generateMember } from "#core/functions/generate-member.function";
import { i18nTree } from "#core/functions/i18n-tree.function";
import type { MemberIR } from "#core/types/member-ir.type";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

const IR: MemberIR = {
  ...COMMERCE_IR,
  catalogues: { en: { loyalty: { card: { tier: "Tier" } } } },
  packageCatalogues: [
    {
      package: "@stackra/loyalty-kit",
      catalogues: {
        ar: { loyalty_kit: { enums: { loyalty_tier: { gold: "ذهبي" } } } },
        en: { loyalty_kit: { enums: { loyalty_tier: { gold: "Gold", silver: "Silver" } } } },
      },
    },
  ],
};

/** One reference at line 1 of a fixture file. */
const ref = (...path: string[]) => ({ file: "src/x.ts", line: 1, column: 1, path });

describe("i18nTree", () => {
  it("merges the package's namespaces beside the member's", () => {
    const { namespaces, clashes } = i18nTree(IR);
    expect([...namespaces.keys()]).toEqual(["loyalty", "loyalty_kit"]);
    expect(namespaces.get("loyalty_kit")).toEqual({
      node: { enums: { loyalty_tier: ["gold", "silver"] } },
      base: "en",
      package: "@stackra/loyalty-kit",
    });
    expect(namespaces.get("loyalty")?.package).toBeUndefined();
    expect(clashes).toEqual([]);
  });
});

describe("checkI18n", () => {
  it("accepts keys and branches of the member or a package", () => {
    expect(
      checkI18n({
        ...IR,
        i18nReferences: [
          ref("loyalty", "card", "tier"),
          ref("loyalty_kit", "enums", "loyalty_tier"),
          ref("loyalty_kit", "enums", "loyalty_tier", "gold"),
          ref("loyalty_kit", "enums", "loyalty_tier", "gold", "length"),
        ],
      }),
    ).toEqual([]);
  });

  it("refuses a key no catalogue ships, with a fix", () => {
    const errors = checkI18n({
      ...IR,
      i18nReferences: [
        ref("loyalty_kit", "enums", "loyalty_tier", "platinum"),
        ref("loyalty", "card", "points"),
        ref("wallets", "title"),
      ],
    });
    expect(errors.map((error) => [error.code, error.subject])).toEqual([
      ["i18n_key_missing", "I18n.loyalty_kit.enums.loyalty_tier.platinum"],
      ["i18n_key_missing", "I18n.loyalty.card.points"],
      ["i18n_key_missing", "I18n.wallets.title"],
    ]);
    expect(errors[0]?.message).toContain("@stackra/loyalty-kit's assets/lang/en/loyalty_kit.json");
    expect(errors[1]?.fix).toContain('add "card.points" to assets/lang/en/loyalty.json');
    expect(errors[2]?.fix).toContain("declare in package.json the @stackra package");
  });

  it("refuses a namespace the member and a package both ship", () => {
    const errors = checkI18n({
      ...IR,
      catalogues: { en: { loyalty_kit: { title: "Mine" } } },
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: "i18n_namespace_clash", subject: "loyalty_kit" });
    expect(errors[0]?.message).toContain(`${IR.package} and @stackra/loyalty-kit`);
    expect(errors[0]?.fix).toContain(
      `rename ${IR.package}'s assets/lang/<locale>/loyalty_kit.json`,
    );
  });

  it("refuses a derived enum label missing from a base-language locale that ships the module (STA-1306)", () => {
    const errors = checkI18n({
      ...COMMERCE_IR,
      catalogues: {
        en: { orders: { enums: { order_status: { pending: "Pending", paid: "Paid" } } } },
        ar: {
          orders: {
            enums: { order_status: { pending: "معلق", paid: "مدفوع", cancelled: "ملغى" } },
          },
        },
        // A regional overlay holds only what differs, and a locale without the namespace is not checked.
        "ar-SA": { orders: {} },
        fr: { carts: { title: "Paniers" } },
      },
    });
    expect(errors.map((error) => [error.code, error.file, error.subject])).toEqual([
      ["i18n_key_missing", "assets/lang/en/orders.json", "orders::enums.order_status.cancelled"],
    ]);
    expect(errors[0]?.fix).toBe('add "enums.order_status.cancelled" to assets/lang/en/orders.json');
  });

  it("checks nothing for a member without @stackra/i18n", () => {
    expect(
      checkI18n({ ...IR, packages: ["@stackra/database"], i18nReferences: [ref("nope", "x")] }),
    ).toEqual([]);
  });

  it("makes generateMember refuse", () => {
    const { files, errors } = generateMember({ ...IR, i18nReferences: [ref("nope", "x")] });
    expect(files).toEqual([]);
    expect(errors.map((error) => error.code)).toContain("i18n_key_missing");
  });
});
