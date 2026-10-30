/**
 * Stackra file contract:
 * Purpose: unit tests of gen-api over three fixtures (leaf, compound, pass-through) and its pure helpers.
 * Boundary: reads `fixtures/ds` only; writes nothing.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2 and the WP2 acceptance row of section 10.
 */
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { applyReplaces } from "../apply-replaces.function.ts";
import { genApi } from "../gen-api.ts";
import { partName } from "../part-name.function.ts";
import { sortProps } from "../sort-props.function.ts";
import { sourceOf } from "../source-of.function.ts";
import { stableJson } from "../stable-json.function.ts";
import { unwrap } from "../unwrap.function.ts";
import type { ApiDoc } from "../../src/types/api-doc.type.ts";
import type { ApiProp } from "../../src/types/api-prop.type.ts";
import type { ComponentEntry } from "../../src/types/component-entry.type.ts";

const ds = join(import.meta.dirname, "fixtures/ds");
const entry = (slug: string, exportName: string, parts: string[]): ComponentEntry =>
  ({
    slug,
    tier: "free",
    category: "actions",
    platforms: ["react"],
    packageName: "@stackra/ui",
    exportName,
    parts,
    hero: {},
    examples: [{ id: "usage", card: true }],
    related: [],
    tokens: [],
    keywords: [],
  }) as ComponentEntry;

function row(name: string, source: ApiProp["source"]): ApiProp {
  return { name, type: "x", required: false, description: "", source };
}

const output = genApi(join(ds, "showcase"), [
  entry("leaf", "Leaf", ["Leaf"]),
  entry("compound", "Compound", ["Compound", "Compound.Item", "Compound.Missing"]),
]);
const doc = (slug: string): ApiDoc => {
  const found = output.docs.find((d) => d.key === `free/${slug}`);
  if (!found) throw new Error(`no ApiDoc for free/${slug}`);
  return found;
};
const prop = (d: ApiDoc, part: number, name: string): ApiProp | undefined =>
  [...(d.parts[part]?.props ?? []), ...(d.parts[part]?.events ?? [])].find((p) => p.name === name);

describe("genApi: leaf", () => {
  it("reads contract props with defaults, expanded enums, replaces and deprecation", () => {
    const leaf = doc("leaf");
    expect(leaf.importLine).toBe('import { Leaf } from "@stackra/ui/react";');
    expect(prop(leaf, 0, "variant")).toMatchObject({
      type: '"primary" | "ghost"',
      default: "primary",
      required: false,
      source: "stackra",
    });
    expect(prop(leaf, 0, "isLoading")?.replaces).toBe("isPending");
    expect(prop(leaf, 0, "isPending")).toBeUndefined();
    expect(prop(leaf, 0, "tone")?.deprecated).toBe("use variant");
    expect(leaf.parts[0]?.events?.map((p) => `${p.name}: ${p.type}`)).toEqual([
      "onPress: () => void",
    ]);
  });
});

describe("genApi: compound", () => {
  it("orders parts by the registry, finds siblings, and keeps an empty table for a missing part", () => {
    const compound = doc("compound");
    expect(compound.parts.map((p) => p.name)).toEqual([
      "Compound",
      "Compound.Item",
      "Compound.Missing",
    ]);
    expect(prop(compound, 0, "title")?.required).toBe(true);
    expect(compound.parts[2]?.props).toEqual([]);
    expect(output.warnings).toContain(
      "free/compound (react): registry part Compound.Missing has no props file",
    );
  });
});

describe("genApi: pass-through", () => {
  it("folds platform members into one spread row and warns about the missing entry", () => {
    const pass = doc("pass");
    expect(pass.parts[0]?.props.map((p) => p.name)).toEqual(["...Date"]);
    expect(output.warnings).toContain("free/pass: props folder without a registry entry");
  });

  it("is deterministic", () => {
    const again = genApi(join(ds, "showcase"), [
      entry("leaf", "Leaf", ["Leaf"]),
      entry("compound", "Compound", ["Compound", "Compound.Item", "Compound.Missing"]),
    ]);
    expect([...again.files]).toEqual([...output.files]);
  });
});

describe("gen-api helpers", () => {
  it("names parts", () => {
    expect(partName("CardTitleProps", "Card")).toBe("Card.Title");
    expect(partName("CardProps", "Card")).toBe("Card");
    expect(partName("DateInputProps", "DateField")).toBe("DateInput");
    expect(partName("Cardigan", "Card")).toBe("Cardigan");
  });

  it("drops the parentheses a function type kept from its union", () => {
    expect(unwrap("(() => void)")).toBe("() => void");
    expect(unwrap("(a: A) => (b: B)")).toBe("(a: A) => (b: B)");
    expect(unwrap("string")).toBe("string");
  });

  it("classifies sources", () => {
    expect(sourceOf("/r/ui/src/contracts/x.ts", "/r/ui/src")).toBe("stackra");
    expect(sourceOf("/r/node_modules/.pnpm/a/node_modules/@heroui/react/x.d.ts", "/r/ui/src")).toBe(
      "heroui",
    );
    expect(sourceOf("/r/node_modules/heroui-native/x.d.ts", "/r/ui/src")).toBe("heroui");
    expect(sourceOf("/r/node_modules/@react-types/shared/dom.d.ts", "/r/ui/src")).toBe(
      "react-aria",
    );
    expect(sourceOf("/r/node_modules/@types/react/index.d.ts", "/r/ui/src")).toBeUndefined();
  });

  it("maps a refused HeroUI prop only onto a prop the part has", () => {
    expect(applyReplaces([row("isLoading", "stackra")], ["isPending", "fullWidth"])).toEqual([
      { ...row("isLoading", "stackra"), replaces: "isPending" },
    ]);
  });

  it("sorts contract first in declaration order, then heroui and react-aria A-Z, spreads last", () => {
    const sorted = sortProps([
      row("...ViewProps", "heroui"),
      row("b", "react-aria"),
      row("z", "stackra"),
      row("c", "heroui"),
      row("a", "stackra"),
      row("a", "react-aria"),
    ]);
    expect(sorted.map((p) => `${p.source}:${p.name}`)).toEqual([
      "stackra:z",
      "stackra:a",
      "heroui:c",
      "react-aria:a",
      "react-aria:b",
      "heroui:...ViewProps",
    ]);
  });

  it("prints JSON with sorted keys", () => {
    expect(stableJson({ b: 1, a: { d: 2, c: 3 } })).toBe(
      '{\n  "a": {\n    "c": 3,\n    "d": 2\n  },\n  "b": 1\n}\n',
    );
  });
});
