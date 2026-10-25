/**
 * Stackra file contract:
 * Purpose: unit and type tests of `assets(tree)`: it returns the generated tree as frozen copies with each key's
 *          literal type, accepts the template's service sample (several kinds, a non-overridable entry), and refuses an
 *          entry whose key is malformed or sits under another module or kind, whose file is not relative, or whose
 *          `overridable` is not a boolean.
 * Boundary: test only; the trees are the template's committed gen samples.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0234; ADR 0306.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { assets } from "#core/functions/assets.function";
import type { AssetEntry } from "#core/types/asset-entry.type";
import type { AssetTree } from "#core/types/asset-tree.type";

const CONSOLE_TREE = {
  console: {
    public: {
      logo_svg: {
        key: "console::public/logo.svg",
        file: "assets/public/logo.svg",
        overridable: true,
      },
    },
  },
  orders: {
    public: {
      logo_svg: {
        key: "orders::public/logo.svg",
        file: "assets/public/orders/logo.svg",
        overridable: true,
      },
    },
  },
} as const;

/** A one-entry tree under `orders.public.logo_svg`, with `entry` in place of the valid one. */
function treeWith(entry: Partial<AssetEntry> | Record<string, unknown>): AssetTree {
  return {
    orders: {
      public: {
        logo_svg: {
          key: "orders::public/logo.svg",
          file: "assets/public/orders/logo.svg",
          overridable: true,
          ...entry,
        } as AssetEntry,
      },
    },
  };
}

describe("assets", () => {
  it("returns the tree with every entry's key, file and overridable flag", () => {
    const Assets = assets(CONSOLE_TREE);
    expect(Assets).toEqual(CONSOLE_TREE);
    expect(Assets.console.public.logo_svg.key).toBe("console::public/logo.svg");
    expect(Assets.orders.public.logo_svg.file).toBe("assets/public/orders/logo.svg");
  });

  it("keeps each key's literal type", () => {
    const Assets = assets(CONSOLE_TREE);
    expectTypeOf(Assets.console.public.logo_svg.key).toEqualTypeOf<"console::public/logo.svg">();
    expectTypeOf(Assets.orders.public.logo_svg.overridable).toEqualTypeOf<true>();
  });

  it("freezes copies at every level, so the caller's objects stay its own", () => {
    const source = {
      web: {
        public: {
          logo_svg: {
            key: "web::public/logo.svg",
            file: "assets/public/logo.svg",
            overridable: true,
          },
        },
      },
    } as const;
    const Assets = assets(source);
    expect(Object.isFrozen(Assets)).toBe(true);
    expect(Object.isFrozen(Assets.web)).toBe(true);
    expect(Object.isFrozen(Assets.web.public)).toBe(true);
    expect(Object.isFrozen(Assets.web.public.logo_svg)).toBe(true);
    expect(Assets.web.public.logo_svg).not.toBe(source.web.public.logo_svg);
    expect(Object.isFrozen(source.web.public.logo_svg)).toBe(false);
  });

  it("accepts several kinds and non-overridable entries", () => {
    const Assets = assets({
      orders: {
        ai: {
          explain_order_md: {
            key: "orders::ai/explain-order.md",
            file: "assets/ai/orders/explain-order.md",
            overridable: true,
          },
          explain_order_eval_json: {
            key: "orders::ai/explain-order.eval.json",
            file: "assets/ai/orders/explain-order.eval.json",
            overridable: false,
          },
        },
        public: {
          logo_svg: {
            key: "orders::public/logo.svg",
            file: "assets/public/orders/logo.svg",
            overridable: true,
          },
        },
      },
    });
    expect(Assets.orders.ai.explain_order_eval_json.overridable).toBe(false);
    expect(Object.keys(Assets.orders)).toEqual(["ai", "public"]);
  });

  it("accepts an empty tree", () => {
    expect(assets({})).toEqual({});
  });

  it("refuses a malformed key", () => {
    expect(() => assets(treeWith({ key: "logo.svg" }))).toThrow(TypeError);
  });

  it("refuses a key that names another module or kind than its place in the tree", () => {
    expect(() => assets(treeWith({ key: "billing::public/logo.svg" }))).toThrow(
      /orders\.public\.logo_svg holds "billing::public\/logo\.svg"/,
    );
    expect(() => assets(treeWith({ key: "orders::ai/logo.svg" }))).toThrow(
      /must start with "orders::public\/"/,
    );
  });

  it("refuses a source file that is not relative to the member root", () => {
    for (const file of ["", "/abs/logo.svg", "../other/assets/public/logo.svg"])
      expect(() => assets(treeWith({ file })), file).toThrow(/relative to the member root/);
  });

  it("refuses an entry whose overridable flag is not a boolean", () => {
    expect(() => assets(treeWith({ overridable: "yes" }))).toThrow(/overridable/);
  });
});
