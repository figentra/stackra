/**
 * Stackra file contract:
 * Purpose: `handleBrowsePackage`: `GET /package/@scope/name` (and under `/ar`): one package's page: description,
 *          install command, licence, versions and dist-tags, and, when the request may read the name, its README,
 *          dependencies and provenance (source commit, workflow, run).
 * Boundary: reads only. The read rule is `readAccess`, the same check the npm routes run through `gate`: an `open`
 *           name shows everything; a `licensed` name without a token that may read it shows only the catalogue's
 *           public metadata; an `internal` name (scope or `name_rules` row) is 404 unless the token may read it. It
 *           never links a packument or tarball, never renders a token, and caches only open pages publicly.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 9, 10 and 13); ADR 0461 (decision 3); STA-1608 spec FR-001, FR-003.
 */
import { readAccess } from "#src/access/read-access";
import { browseNotFound } from "#src/browse/browse-not-found";
import { browsePage } from "#src/browse/browse-page";
import { escapeHtml } from "#src/browse/escape-html";
import { localePath } from "#src/browse/locale-path";
import { provenanceOf } from "#src/browse/provenance-of";
import { readmeHtml } from "#src/browse/readme-html";
import { itemOf } from "#src/catalogue/item-of";
import { publicCache } from "#src/catalogue/public-cache";
import { BROWSE_MESSAGES } from "#src/constants/browse-messages.constant";
import { PRIVATE_NO_STORE } from "#src/constants/private-no-store.constant";
import { splitName } from "#src/http/split-name";
import type { BrowseLocale } from "#src/interfaces/browse-locale.type";
import type { ProvenanceSummary } from "#src/interfaces/provenance-summary.interface";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";
import type { ScopeRow } from "#src/interfaces/scope-row.interface";
import type { VersionRow } from "#src/interfaces/version-row.interface";
import { attestationKey } from "#src/npm/attestation-key";

/** Gated pages differ by token and are never shared. */
const PRIVATE = { "cache-control": PRIVATE_NO_STORE, vary: "authorization" };

/** An http(s) URL for a link, with npm's `git+` and `.git` dressing removed, or null. */
const webUrl = (value: string | null): string | null => {
  const url = value?.replace(/^git\+/, "").replace(/\.git$/, "") ?? null;
  return url !== null && /^https?:\/\//.test(url) ? url : null;
};

/** A date in a locale (Latin digits in Arabic, as the brand's numerals). */
const dateOf = (iso: string, locale: BrowseLocale): string =>
  new Intl.DateTimeFormat(locale === "ar" ? "ar-u-nu-latn" : "en", { dateStyle: "medium" }).format(
    new Date(iso),
  );

/** A dependency map as a list, linking names this registry serves. */
const dependencyList = (
  value: unknown,
  locale: BrowseLocale,
  scopes: readonly string[],
): string => {
  const entries = Object.entries((value ?? {}) as Record<string, unknown>).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );
  if (entries.length === 0)
    return `<p class="muted small">${escapeHtml(BROWSE_MESSAGES[locale].none)}</p>`;
  const rows = entries.map(([dep, range]) => {
    const name = `<bdi>${escapeHtml(dep)}</bdi>`;
    const linked = scopes.includes(splitName(dep).scope)
      ? `<a href="${escapeHtml(localePath(locale, `/package/${dep}`))}">${name}</a>`
      : name;
    return `<li>${linked}<span class="muted" dir="ltr">${escapeHtml(range)}</span></li>`;
  });
  return `<ul>${rows.join("")}</ul>`;
};

/** The provenance section. */
const provenanceSection = (summary: ProvenanceSummary | null, locale: BrowseLocale): string => {
  const text = BROWSE_MESSAGES[locale];
  if (summary === null) return `<p class="muted small">${escapeHtml(text.noProvenance)}</p>`;
  const repository = webUrl(summary.repository);
  const rows: string[] = [];
  if (repository !== null)
    rows.push(
      `<dt>${escapeHtml(text.repository)}</dt><dd dir="ltr"><a href="${escapeHtml(repository)}">${escapeHtml(repository.replace(/^https:\/\/github\.com\//, ""))}</a></dd>`,
    );
  if (summary.commit !== null) {
    const short = escapeHtml(summary.commit.slice(0, 12));
    rows.push(
      `<dt>${escapeHtml(text.commit)}</dt><dd dir="ltr"><code>${repository === null ? short : `<a href="${escapeHtml(`${repository}/commit/${summary.commit}`)}">${short}</a>`}</code></dd>`,
    );
  }
  if (summary.workflow !== null)
    rows.push(
      `<dt>${escapeHtml(text.workflow)}</dt><dd dir="ltr"><code>${escapeHtml(summary.workflow)}${summary.ref === null ? "" : `@${escapeHtml(summary.ref)}`}</code></dd>`,
    );
  const run = webUrl(summary.run);
  if (run !== null)
    rows.push(
      `<dt>${escapeHtml(text.run)}</dt><dd dir="ltr"><a href="${escapeHtml(run)}">${escapeHtml(run.replace(/^https:\/\/github\.com\//, ""))}</a></dd>`,
    );
  return `<dl>${rows.join("")}</dl>`;
};

/**
 * One package's page.
 *
 * @example
 * await handleBrowsePackage(deps, request, "@stackra/core", "en");
 */
export async function handleBrowsePackage(
  deps: RegistryDeps,
  request: Request,
  name: string,
  locale: BrowseLocale,
): Promise<Response> {
  const text = BROWSE_MESSAGES[locale];
  const path = `/package/${name}`;
  const [pkg, row, nameRule] = await Promise.all([
    deps.store.package(name),
    deps.store.scope(splitName(name).scope),
    deps.store.nameRule(name),
  ]);
  if (pkg === null || row === null) return browseNotFound(locale, path);
  const scope: ScopeRow = nameRule === null ? row : { ...row, read_rule: nameRule };
  const access = await readAccess(
    scope,
    name,
    request.headers.get("authorization"),
    deps.licences,
    deps.settings,
    deps.now(),
  );
  if (scope.read_rule === "internal" && !access.allowed) return browseNotFound(locale, path);
  const full = access.allowed;

  const [versions, distTags] = await Promise.all([
    deps.store.versions(name),
    deps.store.distTags(name),
  ]);
  const latest: VersionRow | null =
    versions.find((version) => version.version === distTags.latest) ?? versions.at(-1) ?? null;
  const item = itemOf(
    {
      name,
      scope: pkg.scope,
      kind: pkg.kind,
      modified_at: pkg.modified_at,
      read_rule: scope.read_rule === "open" ? "open" : "licensed",
      latest: latest?.version ?? null,
      manifest: latest?.manifest ?? null,
      deprecated: latest?.deprecated ?? null,
    },
    distTags,
  );
  const pro = scope.licence_rule === "commercial";
  const host = deps.settings.host;
  const scopes = ["@stackra", "@stackra-pro"];

  const [readme, provenance] =
    full && latest !== null
      ? await Promise.all([
          readmeHtml(deps, name, latest.version),
          deps.tarballs
            .get(attestationKey(name, latest.version))
            .then(async (object) =>
              object === null
                ? null
                : provenanceOf(await new Response(object.body).text(), latest.publisher_run),
            ),
        ])
      : (["", null] as const);
  const manifest = (latest === null ? {} : JSON.parse(latest.manifest)) as Record<string, unknown>;

  const npmrc = [
    `${pkg.scope}:registry=https://${host}/`,
    ...(scope.read_rule === "open" ? [] : [`//${host}/:_authToken=\${STACKRA_LICENCE_TOKEN}`]),
  ].join("\n");
  const install = `<section aria-labelledby="install"><h2 id="install">${escapeHtml(text.install)}</h2>
<p class="small">${escapeHtml(text.installOpen)}</p>
${scope.read_rule === "open" ? "" : `<p class="small">${escapeHtml(text.installPro)}</p>`}
<pre><code># .npmrc
${escapeHtml(npmrc)}</code></pre>
<pre><code>pnpm add ${escapeHtml(name)}</code></pre></section>`;

  const repository = webUrl(item.repository);
  const homepage = webUrl(item.homepage);
  const about = `<section aria-labelledby="about"><h2 id="about">${escapeHtml(text.licence)}</h2>
<p class="small">${pro ? `${escapeHtml(text.licencePro)} <a href="${escapeHtml(deps.settings.licenceDocsUrl)}">${escapeHtml(text.licenceLink)}</a>` : `<span dir="ltr">${escapeHtml(item.licence ?? text.none)}</span>`}</p>
<dl>
${item.latest === null ? "" : `<dt>${escapeHtml(text.latest)}</dt><dd dir="ltr">${escapeHtml(item.latest)}</dd>`}
${latest === null ? "" : `<dt>${escapeHtml(text.published)}</dt><dd>${escapeHtml(dateOf(latest.published_at, locale))}</dd>`}
${repository === null ? "" : `<dt>${escapeHtml(text.repository)}</dt><dd dir="ltr"><a href="${escapeHtml(repository)}">${escapeHtml(repository.replace(/^https:\/\//, ""))}</a></dd>`}
${homepage === null ? "" : `<dt>${escapeHtml(text.homepage)}</dt><dd dir="ltr"><a href="${escapeHtml(homepage)}">${escapeHtml(homepage.replace(/^https:\/\//, ""))}</a></dd>`}
${item.keywords.length === 0 ? "" : `<dt>${escapeHtml(text.keywords)}</dt><dd dir="ltr">${item.keywords.map(escapeHtml).join(", ")}</dd>`}
</dl></section>`;

  const tags = Object.entries(distTags)
    .map(
      ([tag, version]) =>
        `<li><span>${escapeHtml(tag)}</span><span dir="ltr">${escapeHtml(version)}</span></li>`,
    )
    .join("");
  const versionList = [...versions]
    // oxlint-disable-next-line unicorn/no-array-reverse -- reverses a copy built here; toReversed is ES2023 and the base lib is ES2022
    .reverse()
    .map(
      (version) =>
        `<li><span dir="ltr">${escapeHtml(version.version)}${version.deprecated === null ? "" : ` <span class="badge warn">${escapeHtml(text.deprecated)}</span>`}</span><span class="muted">${escapeHtml(dateOf(version.published_at, locale))}</span></li>`,
    )
    .join("");
  const releases = `<section aria-labelledby="tags"><h2 id="tags">${escapeHtml(text.distTags)}</h2><ul>${tags}</ul></section>
<section aria-labelledby="versions"><h2 id="versions">${escapeHtml(text.versions)}</h2><ul>${versionList}</ul></section>`;

  const gatedParts = full
    ? `<section aria-labelledby="dependencies"><h2 id="dependencies">${escapeHtml(text.dependencies)}</h2>${dependencyList(manifest.dependencies, locale, scopes)}
${manifest.peerDependencies === undefined ? "" : `<h2>${escapeHtml(text.peerDependencies)}</h2>${dependencyList(manifest.peerDependencies, locale, scopes)}`}</section>
<section aria-labelledby="provenance"><h2 id="provenance">${escapeHtml(text.provenance)}</h2>${provenanceSection(provenance, locale)}</section>`
    : "";

  const badges = [
    pro ? `<span class="badge pro">${escapeHtml(text.pro)}</span>` : "",
    item.deprecated === null
      ? ""
      : `<span class="badge warn">${escapeHtml(text.deprecated)}</span>`,
    item.latest === null ? "" : `<span class="badge" dir="ltr">v${escapeHtml(item.latest)}</span>`,
  ].join(" ");
  const body = `<p class="small"><a href="${localePath(locale, "/")}">${escapeHtml(text.allPackages)}</a></p>
<h1 tabindex="-1"><bdi>${escapeHtml(name)}</bdi></h1>
<p>${badges}</p>
${item.description === null ? "" : `<p class="lead" lang="en" dir="auto">${escapeHtml(item.description)}</p>`}
${item.deprecated === null ? "" : `<p class="note" lang="en" dir="auto">${escapeHtml(item.deprecated)}</p>`}
<div class="layout">
<article class="readme" lang="en" dir="ltr" aria-label="${escapeHtml(text.readme)}">
${full ? readme || `<p class="muted">${escapeHtml(text.noReadme)}</p>` : `<p class="note" lang="${locale}" dir="${locale === "ar" ? "rtl" : "ltr"}">${escapeHtml(text.gated)}</p>`}
</article>
<aside>
${install}
${about}
${gatedParts}
${releases}
</aside>
</div>`;

  return browsePage({
    locale,
    title: `${name} · ${text.title}`,
    body,
    query: "",
    path,
    status: 200,
    headers: scope.read_rule === "open" ? publicCache(deps) : PRIVATE,
  });
}
