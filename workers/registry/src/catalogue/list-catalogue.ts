/**
 * Stackra file contract:
 * Purpose: `listCatalogue`: `GET /-/stackra/v1/catalogue`.
 * Boundary: metadata only, to anyone, for the `open` and `licensed` scopes; never a tarball or file contents beyond
 *           the `stackra` field. `internal` scopes are not listed.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 11, 12 and 13).
 */
import { fromBase64 } from "#src/bytes/from-base64";
import { toBase64Url } from "#src/bytes/to-base64-url";
import { itemOf } from "#src/catalogue/item-of";
import { publicCache } from "#src/catalogue/public-cache";
import { STACKRA_KINDS } from "#src/constants/stackra-kinds.constant";
import { failure } from "#src/http/failure";
import { json } from "#src/http/json";
import type { CataloguePage } from "#src/interfaces/catalogue-page.interface";
import type { CatalogueRow } from "#src/interfaces/catalogue-row.interface";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";

/** A cursor: the last row's publish time and name. */
interface Cursor {
  readonly m: string;
  readonly n: string;
}

const encodeCursor = (row: CatalogueRow): string =>
  toBase64Url(new TextEncoder().encode(JSON.stringify({ m: row.modified_at, n: row.name })));

const decodeCursor = (text: string): Cursor | null => {
  try {
    const cursor = JSON.parse(new TextDecoder().decode(fromBase64(text))) as Partial<Cursor>;
    return typeof cursor.m === "string" && typeof cursor.n === "string"
      ? { m: cursor.m, n: cursor.n }
      : null;
  } catch {
    return null;
  }
};

/**
 * `GET /-/stackra/v1/catalogue`.
 *
 * @example
 * await listCatalogue(deps, new URL("https://npm.stackra.figentra.com/-/stackra/v1/catalogue?kind=skill"));
 */
export async function listCatalogue(deps: RegistryDeps, url: URL): Promise<Response> {
  const params = url.searchParams;
  const kind = params.get("kind") || null;
  if (kind !== null && !(STACKRA_KINDS as readonly string[]).includes(kind))
    return failure(400, `kind must be one of ${STACKRA_KINDS.join(", ")}`);
  const max = deps.settings.catalogueMaxLimit;
  const limit = params.has("limit") ? Number(params.get("limit")) : max;
  if (!Number.isInteger(limit) || limit < 1 || limit > max)
    return failure(400, `limit must be a whole number from 1 to ${max}`);
  const cursorText = params.get("cursor") || null;
  const cursor = cursorText === null ? null : decodeCursor(cursorText);
  if (cursorText !== null && cursor === null) return failure(400, "cursor is not valid");
  const rows = await deps.store.catalogue({
    kind,
    scope: params.get("scope") || null,
    q: params.get("q") || null,
    after: cursor === null ? null : { modifiedAt: cursor.m, name: cursor.n },
    limit,
  });
  const page = rows.slice(0, limit);
  const tags = await deps.store.distTagsOf(page.map((row) => row.name));
  const last = page.at(-1);
  const body: CataloguePage = {
    items: page.map((row) => itemOf(row, tags[row.name] ?? {})),
    next: rows.length > limit && last !== undefined ? encodeCursor(last) : null,
  };
  return json(body, 200, publicCache(deps));
}
