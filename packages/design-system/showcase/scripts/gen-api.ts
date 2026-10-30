/**
 * Stackra file contract:
 * Purpose: `genApi`: one `ApiDoc` per component folder and platform of @stackra/ui (parts from the
 *          sibling `*.props.ts` files in registry order, props, events, render props, animation tables, hooks and
 *          slots, HeroUI's own text filled in from `vendor/heroui*`), plus `api/index.json` and the English `api::`
 *          catalogue seed (`assets/lang/en/api.json`).
 * Boundary: pure over the files it reads; gen.ts writes (or `--check`s) what it returns. No new dependency.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) sections 7.1 and 7.2.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { importLine } from "../src/registry/import-line.function.ts";
import { langSegment } from "../src/registry/lang-segment.function.ts";
import type { ApiDoc } from "../src/types/api-doc.type.ts";
import type { ApiPart } from "../src/types/api-part.type.ts";
import type { ApiProp } from "../src/types/api-prop.type.ts";
import type { ComponentEntry } from "../src/types/component-entry.type.ts";
import type { ApiOutput } from "./api-output.type.ts";
import { applyReplaces } from "./apply-replaces.function.ts";
import type { HeroDoc } from "./hero-doc.type.ts";
import type { HeroPart } from "./hero-part.type.ts";
import type { HeroRow } from "./hero-row.type.ts";
import { listPropsFiles } from "./list-props-files.function.ts";
import { partName } from "./part-name.function.ts";
import type { PropsFile } from "./props-file.type.ts";
import { PropsReader } from "./props.reader.ts";
import { sortProps } from "./sort-props.function.ts";
import { stableJson } from "./stable-json.function.ts";

type Platform = "react" | "native";

const PACKAGES = { ui: ["free", "@stackra/ui"] } as const;

/** HeroUI table rows as ApiProp rows. */
function heroRows(rows: readonly HeroRow[] | undefined): ApiProp[] {
  return (rows ?? []).map((row) => ({
    name: row.name,
    type: row.type,
    ...(row.default ? { default: row.default } : {}),
    required: false,
    description: row.description,
    source: "heroui" as const,
  }));
}

/** Reads `vendor/<dir>/<platform>/<slug>.json`, or undefined. */
function readHero(
  vendor: string,
  dir: string,
  platform: Platform,
  slug: string,
): { doc: HeroDoc; path: string } | undefined {
  const path = join(vendor, dir, platform, `${slug}.json`);
  return existsSync(path)
    ? { doc: JSON.parse(readFileSync(path, "utf8")) as HeroDoc, path }
    : undefined;
}

/** One part: HeroUI-documented members take HeroUI's text and credit; `on*` members become events. */
function buildPart(
  name: string,
  props: readonly ApiProp[],
  omitted: readonly string[],
  hero?: HeroPart,
): ApiPart {
  const rows = applyReplaces(
    props.map((prop) => {
      const row =
        prop.source === "stackra"
          ? undefined
          : hero?.props.find((candidate) => candidate.name === prop.name);
      if (!row) return prop;
      const fallback = prop.default ?? row.default;
      return {
        ...prop,
        source: "heroui" as const,
        description: row.description || prop.description,
        ...(fallback ? { default: fallback } : {}),
      };
    }),
    omitted,
  );
  const passesThrough = rows.some((prop) => prop.source !== "stackra");
  const events = rows.filter((prop) => /^on[A-Z]/.test(prop.name));
  const renderProps = passesThrough ? heroRows(hero?.renderProps) : [];
  const animation = rows.some((prop) => prop.name === "animation") ? heroRows(hero?.animation) : [];
  return {
    name,
    ...(passesThrough && hero ? { extends: hero.name } : {}),
    props: sortProps(rows.filter((prop) => !events.includes(prop))),
    ...(renderProps.length > 0 ? { renderProps } : {}),
    ...(events.length > 0 ? { events: sortProps(events) } : {}),
    ...(animation.length > 0 ? { animation } : {}),
  };
}

/** Writes each described prop of `doc` into the nested `api::` catalogue `lang` (first description wins). */
function seedLang(
  lang: Record<string, unknown>,
  tier: string,
  slug: string,
  parts: readonly ApiPart[],
): void {
  for (const part of parts) {
    for (const prop of [...part.props, ...(part.events ?? [])]) {
      if (!prop.description || prop.name.startsWith("...")) continue;
      let node = lang;
      for (const segment of [tier, langSegment(slug), ...part.name.split(".")]) {
        const next = node[segment];
        node = (next && typeof next === "object" ? next : (node[segment] = {})) as Record<
          string,
          unknown
        >;
      }
      node[prop.name] ??= prop.description;
    }
  }
}

/** Builds every ApiDoc. `showcase` is the package root (its parent holds ui), `entries` the registry. */
export function genApi(showcase: string, entries: readonly ComponentEntry[]): ApiOutput {
  const ds = join(showcase, "..");
  const vendor = join(showcase, "vendor");
  const files = new Map<string, string>();
  const docs: ApiDoc[] = [];
  const warnings: string[] = [];
  const index: Record<
    string,
    { react?: true; native?: true; partsCount: number; propsCount: number }
  > = {};
  const lang: Record<string, unknown> = {};
  const all = listPropsFiles(ds);
  const readers = {
    ui: new PropsReader(
      join(ds, "ui", "src"),
      all.filter((f) => f.pkg === "ui").map((f) => f.file),
    ),
  };
  const groups = new Map<string, PropsFile[]>();
  for (const file of all) {
    const id = `${file.pkg}/${file.platform}/${file.slug}`;
    groups.set(id, [...(groups.get(id) ?? []), file]);
  }
  for (const group of groups.values()) {
    const [first] = group;
    if (!first) continue;
    const { pkg, platform, slug } = first;
    const [tier, packageName] = PACKAGES[pkg];
    const key = `${tier}/${slug}`;
    const entry = entries.find((candidate) => candidate.tier === tier && candidate.slug === slug);
    if (!entry) warnings.push(`${key}: props folder without a registry entry`);
    const reader = readers[pkg];
    const mainFile = (group.find((f) => f.file.endsWith(`/${slug}.props.ts`)) ?? first).file;
    const read = group.flatMap((f) => {
      const result = reader.read(f.file, platform);
      return result ? [{ file: f.file, ...result }] : [];
    });
    const main =
      entry?.exportName ??
      read.find((r) => r.file === mainFile)?.typeName.replace(/Props$/, "") ??
      slug;
    const link = entry?.hero[platform];
    const hero = link ? readHero(vendor, "heroui", platform, link.slug) : undefined;

    const built = new Map<string, ApiPart>();
    // a `*.returns.ts` types a hook's return value: the hook is listed under Hooks, not as a part
    const ownHooks = read
      .filter(({ file }) => file.endsWith(".returns.ts"))
      .map(({ target, props }) => ({
        name: main,
        signature: `${main}(): ${target}`,
        returns: props,
      }));
    for (const { file, typeName, props, omitted } of read) {
      if (file.endsWith(".returns.ts")) continue;
      const isMain = file === mainFile;
      const name = isMain ? main : partName(typeName, main);
      const heroPart =
        hero?.doc.parts.find((part) => part.name === name) ??
        (isMain ? hero?.doc.parts[0] : undefined);
      built.set(name, buildPart(name, props, omitted, heroPart));
    }
    const parts: ApiPart[] = [];
    for (const name of new Set([...(entry?.parts ?? []), main, ...[...built.keys()].toSorted()])) {
      const part = built.get(name);
      if (part) {
        parts.push(part);
      } else if (entry?.parts.includes(name) && !ownHooks.some((hook) => hook.name === name)) {
        warnings.push(`${key} (${platform}): registry part ${name} has no props file`);
        parts.push({ name, props: [] });
      }
    }
    const indexFile = join(ds, pkg, "src", platform, "index.ts");
    const entryIndex = existsSync(indexFile) ? readFileSync(indexFile, "utf8") : "";
    // a HeroUI hook is listed only when our entry re-exports it
    const hooks = [
      ...ownHooks,
      ...(platform === "native" ? (hero?.doc.hooks ?? []) : [])
        .filter((hook) => new RegExp(`\\b${hook.name}\\b`).test(entryIndex))
        .map((hook) => ({
          name: hook.name,
          signature: hook.signature,
          returns: heroRows(hook.returns),
        })),
    ];
    const isHeroRendered = parts[0]?.props.some((prop) => prop.source !== "stackra") ?? false;
    const slots =
      platform === "react"
        ? isHeroRendered
          ? (hero?.doc.slots ?? [])
          : []
        : read.flatMap(({ file }) => reader.classNameSlots(file));
    const body = {
      parts,
      ...(hooks.length > 0 ? { hooks } : {}),
      ...(slots.length > 0 ? { slots } : {}),
    };
    const doc: ApiDoc = {
      key,
      platform,
      importLine: importLine({ packageName, exportName: main }, platform),
      generatedFrom: {
        propsFiles: group.map((f) => relative(ds, f.file)),
        ...(hero ? { heroDoc: relative(showcase, hero.path) } : {}),
        hash: createHash("sha256").update(JSON.stringify(body)).digest("hex").slice(0, 16),
      },
      ...body,
    };
    docs.push(doc);
    files.set(`api/${platform}/${key}.json`, stableJson(doc));
    const propsCount = parts.reduce(
      (sum, part) => sum + part.props.length + (part.events?.length ?? 0),
      0,
    );
    const row = index[key] ?? { partsCount: 0, propsCount: 0 };
    index[key] = {
      ...row,
      [platform]: true,
      partsCount: Math.max(row.partsCount, parts.length),
      propsCount: Math.max(row.propsCount, propsCount),
    };
    seedLang(lang, tier, slug, parts);
  }
  files.set("api/index.json", stableJson(index));
  files.set("assets/lang/en/api.json", stableJson(lang));
  return { files, docs, warnings };
}
