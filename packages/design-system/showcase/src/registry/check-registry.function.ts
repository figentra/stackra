/**
 * Stackra file contract:
 * Purpose: `checkRegistry`, the registry gate (`check.ts` of the spec): entry shapes, unique keys, related keys,
 *          the one card example, parts, HeroUI URL patterns, the implied catalogue keys in English and Arabic
 *          (Arabic missing in showcase.json is fatal, owner Q3), the doc-page hero, pillar and RTL keys of every entry and
 *          category plus the keys its `COMPONENT_DOCS` row implies (STA-1371), and that every current web route and mobile screen
 *          maps to an entry. Missing demo files and hidden Pro docs links are reported, not fatal, until WP6/WP9 land.
 * Boundary: a pure function over what it is given; the test that runs it reads the files.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 7.3; owner answers Q1, Q3, Q5.
 */
import { ComponentCategory } from "#src/enums/component-category.enum";
import { ComponentSection } from "#src/enums/component-section.enum";
import type { Platform } from "#src/enums/platform.enum";
import { byWebPath } from "#src/registry/by-web-path.function";
import { categoryDocKeys } from "#src/registry/category-doc-keys.function";
import { categoryKeys } from "#src/registry/category-keys.function";
import { COMPONENT_DOCS } from "#src/registry/component-docs.constant";
import { componentKeys } from "#src/registry/component-keys.function";
import { docKeys } from "#src/registry/doc-keys.function";
import { entryKey } from "#src/registry/entry-key.function";
import { lookupMessage } from "#src/registry/lookup-message.function";
import { sectionKey } from "#src/registry/section-key.function";
import { ComponentEntrySchema } from "#src/schemas/component-entry.schema";
import type { HeroLink } from "#src/types/hero-link.type";
import type { RegistryCheckInput } from "#src/types/registry-check-input.type";
import type { RegistryReport } from "#src/types/registry-report.type";

/** The OSS docs URL every `@heroui/react` or `heroui-native` link must have. */
const OSS_DOCS = /^https:\/\/www\.heroui\.com\/docs\/(react|native)\/components\/[a-z0-9-]+$/;

/** The OSS source URL patterns. */
const OSS_SOURCE =
  /^https:\/\/github\.com\/heroui-inc\/(heroui\/tree\/v3\/packages\/react|heroui-native\/tree\/main)\/src\/components\/[\w./-]+$/;

/** Web routes that are the shell's own pages, not components. */
const SHELL_ROUTES = new Set(["home", "components", "theme-studio"]);

/** Runs the registry gate. `errors` must be empty for the gate to pass. */
export function checkRegistry(input: RegistryCheckInput): RegistryReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const report: string[] = [];
  const keys = new Set<string>();
  const { entries, catalogues } = input;
  const all = new Set(entries.map(entryKey));

  const requireMessage = (key: string, owner: string) => {
    if (lookupMessage(catalogues.en, key) === undefined) errors.push(`${owner}: en missing ${key}`);
    if (lookupMessage(catalogues.ar, key) === undefined) errors.push(`${owner}: ar missing ${key}`);
  };

  for (const category of ComponentCategory) {
    const implied = categoryKeys(category);
    requireMessage(implied.title, `category ${category}`);
    requireMessage(implied.description, `category ${category}`);
    for (const key of Object.values(categoryDocKeys(category)))
      requireMessage(key, `category ${category}`);
  }
  for (const section of ComponentSection) requireMessage(sectionKey(section), `section ${section}`);

  for (const entry of entries) {
    const key = entryKey(entry);
    const parsed = ComponentEntrySchema.safeParse(entry);
    if (!parsed.success) errors.push(`${key}: ${parsed.error.message}`);
    if (keys.has(key)) errors.push(`${key}: duplicate key`);
    keys.add(key);
    if (entry.parts[0] !== entry.exportName)
      errors.push(`${key}: parts[0] must be ${entry.exportName}`);
    for (const related of entry.related) {
      if (related === key || !all.has(related))
        errors.push(`${key}: related ${related} is not an entry`);
    }

    const isPlanned = entry.status === "planned";
    const cards = entry.examples.filter((example) => example.card).length;
    if (!isPlanned && cards !== 1)
      errors.push(`${key}: needs exactly one card example, has ${cards}`);
    if (!isPlanned && entry.examples.length === 0)
      errors.push(`${key}: needs at least one example`);
    const ids = new Set<string>();
    for (const example of entry.examples) {
      if (ids.has(example.id)) errors.push(`${key}: duplicate example ${example.id}`);
      ids.add(example.id);
      for (const platform of example.platforms ?? []) {
        if (!entry.platforms.includes(platform)) {
          errors.push(`${key}: example ${example.id} names ${platform}, which the entry is not on`);
        }
      }
      for (const platform of example.platforms ?? entry.platforms) {
        const found = input.demos?.[platform];
        if (found && !found.has(`${key}/${example.id}`)) {
          warnings.push(`${key}: no ${platform} demo for ${example.id}`);
        }
      }
    }

    for (const [platform, link] of Object.entries(entry.hero) as [Platform, HeroLink][]) {
      if (!entry.platforms.includes(platform)) {
        errors.push(`${key}: hero link for ${platform}, which the entry is not on`);
      }
      const isOss = link.pkg === "@heroui/react" || link.pkg === "heroui-native";
      if (isOss && !(link.docsUrl && OSS_DOCS.test(link.docsUrl))) {
        errors.push(`${key}: OSS ${platform} docsUrl must match ${OSS_DOCS.source}`);
      }
      if (isOss && link.sourceUrl && !OSS_SOURCE.test(link.sourceUrl)) {
        errors.push(`${key}: OSS ${platform} sourceUrl does not match the HeroUI repository`);
      }
      if (!isOss && !link.docsUrl)
        report.push(`${key}: Pro ${platform} docs link hidden (no Pro MCP snapshot)`);
    }

    const implied = componentKeys(entry);
    requireMessage(implied.title, key);
    requireMessage(implied.description, key);
    requireMessage(implied.keywords, key);
    const doc = docKeys(entry);
    for (const docKey of [
      ...Object.values(doc.fields),
      ...(doc.whenNot ? [doc.whenNot] : []),
      ...doc.do,
      ...doc.dont,
      ...doc.anatomy.map((part) => part.label),
      ...doc.alternatives.map((alternative) => alternative.reason),
      ...doc.keyboard.map((row) => row.action),
    ])
      requireMessage(docKey, `${key} doc`);
    for (const alternative of COMPONENT_DOCS[key]?.alternatives ?? [])
      if (!all.has(alternative)) errors.push(`${key}: alternative ${alternative} is not an entry`);
    for (const [id, example] of Object.entries(implied.examples)) {
      requireMessage(example.title, `${key} example ${id}`);
      const note = lookupMessage(catalogues.en, example.note);
      if (note !== undefined && lookupMessage(catalogues.ar, example.note) === undefined) {
        errors.push(`${key} example ${id}: ar missing ${example.note}`);
      }
    }
  }

  for (const route of input.webRoutes ?? []) {
    if (SHELL_ROUTES.has(route)) continue;
    const entry = byWebPath(`/${route}`, entries);
    if (!entry?.platforms.includes("react"))
      errors.push(`web route ${route} maps to no react entry`);
  }
  for (const screen of input.mobileScreens ?? []) {
    const entry = entries.find((item) => entryKey(item) === screen);
    if (!entry?.platforms.includes("native"))
      errors.push(`mobile screen ${screen} maps to no native entry`);
  }

  return { errors, warnings, report };
}
