/**
 * Stackra file contract:
 * Purpose: plan every file of the schemas site from the working-tree schemas and the tagged releases: the moving
 *          paths, the immutable exact-version trees, the per-major aliases, `/schemas/index.json`, the landing and
 *          404 page and `/_headers`.
 * Boundary: pure; reads and writes nothing, so the whole URL layout is unit-tested here.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files, decisions 2 to 4).
 */
import { SCHEMAS_PATH, STATIC_HOST } from "#src/constants";
import type {
  ParsedSchema,
  SchemaIndexEntry,
  SchemaRelease,
  SchemaSource,
  SiteFile,
} from "#src/interfaces";

import { compareVersions } from "./compare-versions";
import { parseSchema } from "./parse-schema";
import { renderHeaders } from "./render-headers";
import { renderPage } from "./render-page";

/**
 * Serialise a schema for one published path, with `$id` rewritten to that path's own URL. JSON Schema resolves
 * relative `$ref`s against `$id`, so a copy under `/schemas/1.4.0/` must name itself, or its references would
 * silently resolve against the moving latest version.
 */
function publish(schema: ParsedSchema, path: string): string {
  return `${JSON.stringify({ ...schema.document, $id: `https://${STATIC_HOST}${path}` }, null, 2)}\n`;
}

/**
 * Plan the site. Layout, for a schema whose `$id` is `https://static.stackra.figentra.com/schemas/runway/app.json`
 * (name `/runway/app.json`):
 *
 * | Path                              | Content                         | Cache               |
 * | --------------------------------- | ------------------------------- | ------------------- |
 * | `/schemas/runway/app.json`        | working tree (main)             | revalidate (moving) |
 * | `/schemas/latest/runway/app.json` | same as above                   | revalidate (moving) |
 * | `/schemas/v1/runway/app.json`     | newest `schemas@1.x.y` release  | revalidate (moving) |
 * | `/schemas/1.4.0/runway/app.json`  | the `schemas@1.4.0` tag         | one year, immutable |
 *
 * plus `/schemas/index.json` (every latest schema and every release), `/index.html` and `/404.html` (the one page
 * for people, see render-page.ts) and `/_headers` (see render-headers.ts), which Cloudflare only reads at the root of
 * the assets folder.
 *
 * @param latest - the schemas in the working tree; empty before STA-305 lands, which still yields a valid site.
 * @param releases - every tagged release, in any order.
 * @returns every file to write, each path unique.
 * @throws Error when a schema is invalid (see parseSchema) or two files would land on the same path.
 */
export function planSite(
  latest: readonly SchemaSource[],
  releases: readonly SchemaRelease[],
): SiteFile[] {
  const files = new Map<string, string>();
  const add = (path: string, body: string): void => {
    if (files.has(path)) throw new Error(`two files would be published at ${path}`);
    files.set(path, body);
  };
  // Publish one schema under one alias tree ("" is the $id path itself).
  const addSchema = (schema: ParsedSchema, tree: string): void => {
    const path = `${SCHEMAS_PATH}${tree}${schema.name}`;
    add(path, publish(schema, path));
  };
  const newestFirst = [...releases].sort((a, b) => compareVersions(b.version, a.version));

  const index: SchemaIndexEntry[] = [];
  for (const schema of latest.map(parseSchema)) {
    addSchema(schema, "");
    addSchema(schema, "/latest");
    index.push({ id: `https://${STATIC_HOST}${SCHEMAS_PATH}${schema.name}`, title: schema.title });
  }

  const majors = new Set<string>();
  for (const release of newestFirst) {
    const schemas = release.schemas.map(parseSchema);
    for (const schema of schemas) addSchema(schema, `/${release.version}`);
    // Releases are newest first, so the first release seen for a major is the one its alias points at.
    const major = `v${release.version.split(".")[0]}`;
    if (majors.has(major)) continue;
    majors.add(major);
    for (const schema of schemas) addSchema(schema, `/${major}`);
  }

  index.sort((a, b) => a.id.localeCompare(b.id));
  const releaseVersions = newestFirst.map((release) => release.version);
  add(
    `${SCHEMAS_PATH}/index.json`,
    `${JSON.stringify({ host: STATIC_HOST, schemas: index, releases: releaseVersions }, null, 2)}\n`,
  );
  // One page for people: `/` serves index.html, and wrangler.jsonc's `404-page` serves 404.html for any unknown path.
  const page = renderPage();
  add("/index.html", page);
  add("/404.html", page);
  add("/_headers", renderHeaders(releaseVersions));
  return [...files].map(([path, body]) => ({ path, body }));
}
