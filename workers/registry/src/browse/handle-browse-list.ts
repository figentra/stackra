/**
 * Stackra file contract:
 * Purpose: `handleBrowseList`: `GET /` and `GET /ar/`: every listed package as cards grouped by category (the
 *          `stackra.category` of its latest package.json, or its kind), filtered by `?q=` on the name or description.
 * Boundary: reads the catalogue only, so it lists exactly what `/-/stackra/v1/catalogue` lists: no `internal` scope
 *           and no `name_rules` name. Public metadata, publicly cached.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 11 to 13); ADR 0461 (decision 3); STA-1608 spec FR-001, FR-002, FR-007.
 */
import { browsePage } from "#src/browse/browse-page";
import { escapeHtml } from "#src/browse/escape-html";
import { localePath } from "#src/browse/locale-path";
import { itemOf } from "#src/catalogue/item-of";
import { publicCache } from "#src/catalogue/public-cache";
import { BROWSE_CATEGORIES_AR } from "#src/constants/browse-categories-ar.constant";
import { BROWSE_MESSAGES } from "#src/constants/browse-messages.constant";
import type { BrowseLocale } from "#src/interfaces/browse-locale.type";
import type { CatalogueItem } from "#src/interfaces/catalogue-item.interface";
import type { CatalogueRow } from "#src/interfaces/catalogue-row.interface";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";

/** Every catalogue row matching `q`, page by page. */
async function allRows(deps: RegistryDeps, q: string | null): Promise<CatalogueRow[]> {
  const limit = deps.settings.catalogueMaxLimit;
  const rows: CatalogueRow[] = [];
  let after: { modifiedAt: string; name: string } | null = null;
  for (;;) {
    const page = await deps.store.catalogue({ kind: null, scope: null, q, after, limit });
    rows.push(...page.slice(0, limit));
    const last = page.at(limit - 1);
    if (page.length <= limit || last === undefined) return rows;
    after = { modifiedAt: last.modified_at, name: last.name };
  }
}

/** The group key of an item: its category, else its kind when it is not a plain package, else "". */
const groupOf = (item: CatalogueItem): string => {
  const category = item.stackra.category;
  if (typeof category === "string" && category !== "") return category;
  return item.kind === "package" ? "" : item.kind;
};

/** A group key's heading in a locale. */
const groupLabel = (key: string, locale: BrowseLocale): string => {
  if (key === "") return BROWSE_MESSAGES[locale].other;
  if (locale === "ar") return BROWSE_CATEGORIES_AR[key] ?? key;
  const words = key.replaceAll("-", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** One package card. */
const card = (item: CatalogueItem, locale: BrowseLocale): string => {
  const text = BROWSE_MESSAGES[locale];
  const href = localePath(locale, `/package/${item.name}`);
  const badges = [
    item.access === "licensed" ? `<span class="badge pro">${escapeHtml(text.pro)}</span>` : "",
    item.deprecated === null
      ? ""
      : `<span class="badge warn">${escapeHtml(text.deprecated)}</span>`,
  ].join("");
  return `<li class="card">
<a href="${escapeHtml(href)}"><bdi>${escapeHtml(item.name)}</bdi></a>
${item.description === null ? "" : `<p lang="en" dir="auto">${escapeHtml(item.description)}</p>`}
<div class="meta">${item.latest === null ? "" : `<span dir="ltr">v${escapeHtml(item.latest)}</span>`}${badges}</div>
</li>`;
};

/**
 * The package list page.
 *
 * @example
 * await handleBrowseList(deps, new URL("https://npm.stackra.figentra.com/?q=config"), "en");
 */
export async function handleBrowseList(
  deps: RegistryDeps,
  url: URL,
  locale: BrowseLocale,
): Promise<Response> {
  const text = BROWSE_MESSAGES[locale];
  const query = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const rows = await allRows(deps, query === "" ? null : query);
  const tags = await deps.store.distTagsOf(rows.map((row) => row.name));
  const groups = new Map<string, CatalogueItem[]>();
  for (const row of rows) {
    const item = itemOf(row, tags[row.name] ?? {});
    const key = groupOf(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const keys = [...groups.keys()].sort((a, b) =>
    a === "" ? 1 : b === "" ? -1 : a.localeCompare(b),
  );
  const sections = keys.map((key) => {
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts a copy built here; toSorted is ES2023 and the base lib is ES2022
    const items = [...(groups.get(key) ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    return `<section class="group" aria-labelledby="group-${escapeHtml(key || "other")}">
<h2 id="group-${escapeHtml(key || "other")}">${escapeHtml(groupLabel(key, locale))} <span>${items.length}</span></h2>
<ul class="cards">${items.map((item) => card(item, locale)).join("\n")}</ul>
</section>`;
  });
  const count = text.count.replace("{n}", String(rows.length));
  const body = `<h1 tabindex="-1">${escapeHtml(text.title)}</h1>
<p class="lead">${escapeHtml(text.tagline)} <span class="muted">${escapeHtml(count)}</span></p>
${rows.length === 0 && query !== "" ? `<p class="note">${escapeHtml(text.noResults.replace("{q}", query))}</p>` : ""}
${sections.join("\n")}`;
  return browsePage({
    locale,
    title: query === "" ? text.title : `${query} · ${text.title}`,
    body,
    query,
    path: query === "" ? "/" : `/?q=${encodeURIComponent(query)}`,
    status: 200,
    headers: publicCache(deps),
  });
}
