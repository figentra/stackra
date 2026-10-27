/**
 * Stackra file contract:
 * Purpose: `httpCatalogueClient(access)`, the `CatalogueClient` over the registry's HTTP API: the item from
 *          `GET /-/stackra/v1/catalogue/@scope/name`, the version manifest from `GET /@scope/name/<version>` and its
 *          tarball from `dist.tarball`, checked against `dist.integrity`.
 * Boundary: reads only. Checks every answer before trusting it (the catalogue schema, an SHA-512 integrity it
 *           recomputes) and sends the licence token only to the registry's own origin.
 * Runtime: node
 * Governing contract: ADR 0453 (decisions 4, 8, 10 and 12).
 */
import { createHash } from "node:crypto";

import { CATALOGUE_ITEM_SCHEMA } from "@stackra/skills/contracts";

import type { CatalogueClient } from "#node/types/catalogue-client.type";
import type { RegistryAccess } from "#node/types/registry-access.type";

/**
 * The registry client `stackra add` uses.
 *
 * @param access - the registry origin and licence token.
 * @param fetcher - the fetch to use; the global one by default.
 * @example
 * const client = httpCatalogueClient({ origin: "https://npm.stackra.figentra.com/", token: undefined });
 */
export function httpCatalogueClient(
  { origin, token }: RegistryAccess,
  fetcher: typeof fetch = fetch,
): CatalogueClient {
  const base = new URL(origin);
  const get = async (url: URL): Promise<Response> => {
    if (url.origin !== base.origin)
      throw new Error(`refused a URL outside the registry: ${url.href}`);
    const response = await fetcher(url, {
      headers: token === undefined ? {} : { authorization: `Bearer ${token}` },
    });
    return response;
  };
  return {
    async item(name) {
      const response = await get(new URL(`-/stackra/v1/catalogue/${name}`, base));
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`${name}: the catalogue answered ${response.status}`);
      return CATALOGUE_ITEM_SCHEMA.parse(await response.json());
    },
    async tarball(name, version) {
      const manifest = await get(new URL(`${name}/${encodeURIComponent(version)}`, base));
      if (!manifest.ok)
        throw new Error(`${name}@${version}: the registry answered ${manifest.status}`);
      const { dist } = (await manifest.json()) as {
        dist?: { tarball?: unknown; integrity?: unknown };
      };
      if (typeof dist?.tarball !== "string" || typeof dist.integrity !== "string") {
        throw new Error(`${name}@${version}: the manifest has no dist.tarball or dist.integrity`);
      }
      const file = await get(new URL(dist.tarball, base));
      if (!file.ok) throw new Error(`${name}@${version}: the tarball answered ${file.status}`);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const integrity = `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
      if (integrity !== dist.integrity) {
        throw new Error(`${name}@${version}: the tarball does not match its integrity`);
      }
      return { bytes, integrity };
    },
  };
}
