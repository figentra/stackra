/**
 * Stackra file contract:
 * Purpose: the registry gate of @stackra/showcase over the real registry, the real catalogues and the apps' current
 *          route and screen folders (every one must map to an entry), plus the gate's own failure cases.
 * Boundary: reads files under the repository; renders nothing.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) sections 7.3 and 10 (WP1 acceptance).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { ComponentCategory } from "#src/enums/component-category.enum";
import { checkRegistry } from "#src/registry/check-registry.function";
import { COMPONENTS } from "#src/registry/components.generated";
import { ComponentEntrySchema } from "#src/schemas/component-entry.schema";
import type { ComponentEntry } from "#src/types/component-entry.type";

const PACKAGE = fileURLToPath(new URL("../../../", import.meta.url));
const APPS = join(PACKAGE, "../../../apps");

/** The parsed showcase catalogue of `locale`. */
function catalogue(locale: string): unknown {
  return JSON.parse(readFileSync(join(PACKAGE, `assets/lang/${locale}/showcase.json`), "utf8"));
}

/** `<tier>/<slug>/<id>` for every demo file under `root`, or undefined while the folder does not exist. */
function demos(root: string): ReadonlySet<string> | undefined {
  if (!existsSync(root)) return undefined;
  const found = new Set<string>();
  for (const tier of ["free"]) {
    if (!existsSync(join(root, tier))) continue;
    for (const slug of readdirSync(join(root, tier))) {
      for (const file of readdirSync(join(root, tier, slug))) {
        if (file.endsWith(".tsx")) found.add(`${tier}/${slug}/${file.slice(0, -4)}`);
      }
    }
  }
  return found;
}

/** `value`, or a thrown error naming what was missing (keeps tests free of non-null assertions). */
function must<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`missing ${what}`);
  return value;
}

const CATALOGUES = { en: catalogue("en"), ar: catalogue("ar") };

/** How many entries of `platform` are built (not planned). */
const built = (platform: "react" | "native") =>
  COMPONENTS.filter((entry) => entry.status !== "planned" && entry.platforms.includes(platform))
    .length;

describe("checkRegistry", () => {
  it("passes over the real registry, catalogues, web routes and mobile screens", () => {
    const webRoutes = readdirSync(join(APPS, "playground/src/routes"));
    const mobileScreens = ["free"]
      .filter((tier) => existsSync(join(APPS, "mobile/src/screens", tier)))
      .flatMap((tier) =>
        readdirSync(join(APPS, "mobile/src/screens", tier))
          .filter((file) => file.endsWith("-screen.tsx"))
          .map((file) => `${tier}/${file.slice(0, -"-screen.tsx".length)}`),
      );
    const react = demos(join(APPS, "playground/src/demos"));
    const native = demos(join(APPS, "mobile/src/demos"));
    const result = checkRegistry({
      entries: COMPONENTS,
      catalogues: CATALOGUES,
      webRoutes,
      mobileScreens,
      demos: { ...(react ? { react } : {}), ...(native ? { native } : {}) },
    });
    // The report (hidden Pro links, missing demos) is printed, never fatal.
    if (result.warnings.length + result.report.length > 0) {
      // oxlint-disable-next-line no-console -- the test prints the non-fatal registry report for the developer on purpose
      console.info([...result.warnings, ...result.report].join("\n"));
    }
    expect(result.errors).toEqual([]);
    // Free only (ADR 0461): every built entry has its page, and the shell adds its own.
    expect(webRoutes.length).toBeGreaterThanOrEqual(built("react"));
    // The mobile app draws every native entry in its one component screen, so no per-entry screen file remains.
    expect(mobileScreens).toEqual([]);
    expect(built("native")).toBeGreaterThan(0);
  });

  it("lists every category's entries and no planned gaps left", () => {
    // Free only (ADR 0461): every category has an entry, charts included since Stackra drew its own (STA-1371).
    expect(new Set(COMPONENTS.map((entry) => entry.category)).size).toBe(ComponentCategory.length);
    expect(COMPONENTS.filter((entry) => entry.status === "planned")).toHaveLength(0);
  });

  it("fails on a duplicate key, a missing Arabic message and an unmapped route", () => {
    const button = must(
      COMPONENTS.find((entry) => entry.tier === "free" && entry.slug === "button"),
      "free/button",
    );
    const entries: ComponentEntry[] = [button, button];
    const result = checkRegistry({
      entries,
      catalogues: { en: CATALOGUES.en, ar: {} },
      webRoutes: ["button", "not-a-component"],
      mobileScreens: ["pro/not-a-screen"],
    });
    expect(result.errors).toContain("free/button: duplicate key");
    expect(result.errors).toContain(
      "free/button: ar missing showcase::component.free.button.title",
    );
    expect(result.errors).toContain("web route not-a-component maps to no react entry");
    expect(result.errors).toContain("mobile screen pro/not-a-screen maps to no native entry");
  });

  it("fails an entry without a card example and a related key that does not exist", () => {
    const button = must(
      COMPONENTS.find((entry) => entry.tier === "free" && entry.slug === "button"),
      "free/button",
    );
    const broken: ComponentEntry = {
      ...button,
      examples: button.examples.map(({ card: _card, ...example }) => example),
      related: ["free/nothing"],
    };
    const { errors } = checkRegistry({ entries: [broken], catalogues: CATALOGUES });
    expect(errors).toContain("free/button: needs exactly one card example, has 0");
    expect(errors).toContain("free/button: related free/nothing is not an entry");
  });

  it("marks the specialist charts advanced, apart from the tier, and takes only `true`", () => {
    const advanced = COMPONENTS.filter((entry) => entry.advanced).map(
      (entry) => `${entry.tier}/${entry.slug}`,
    );
    expect(new Set(advanced)).toEqual(
      new Set([
        "free/box-plot-chart",
        "free/choropleth-map",
        "free/chord-diagram",
        "free/network-graph",
        "free/sankey-chart",
        "free/sunburst-chart",
        "free/tree-diagram",
        "free/word-cloud",
      ]),
    );
    const button = must(
      COMPONENTS.find((entry) => entry.slug === "button"),
      "free/button",
    );
    expect(ComponentEntrySchema.safeParse({ ...button, advanced: true }).success).toBe(true);
    expect(ComponentEntrySchema.safeParse({ ...button, advanced: false }).success).toBe(false);
  });
});
