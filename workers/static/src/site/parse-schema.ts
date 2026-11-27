/**
 * Stackra file contract:
 * Purpose: validate one schema file and derive the name it is published under from its `$id`.
 * Boundary: pure; reads no file and throws on the first problem, naming the file.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files, decisions 2 and 3 as amended).
 */
import { SCHEMAS_PATH, STATIC_HOSTS } from "#src/constants";
import type { ParsedSchema, SchemaSource } from "#src/interfaces";

/**
 * First segments below `/schemas` that the site keeps for itself. A schema named with one would collide with an alias
 * tree (`/schemas/latest/…`, `/schemas/v1/…`, `/schemas/1.4.0/…`) or the listing (`/schemas/index.json`).
 */
const RESERVED_SEGMENT = /^(?:latest|v\d+|\d+\.\d+\.\d+|index\.json)$/;

/**
 * Parse a schema file and return its name, title and document.
 *
 * The `$id` is the single source of the URL: it must be `https://<host>/schemas/<name>.json` with no query or
 * fragment, where `<host>` is one of `STATIC_HOSTS` (`static.figentra.com` for a new schema; an existing one keeps
 * `static.stackra.figentra.com`), so the address an editor resolves is exactly an address the Worker serves.
 *
 * @param source - the file as read from the working tree or a release tag.
 * @returns the validated schema.
 * @throws Error when the text is not a JSON object, `$id` is missing, names another scheme or host, lies outside
 *   `/schemas/`, does not end in `.json`, or its first segment below `/schemas` is reserved.
 */
export function parseSchema(source: SchemaSource): ParsedSchema {
  let document: unknown;
  try {
    document = JSON.parse(source.text);
  } catch (error) {
    throw new Error(`${source.file}: not valid JSON (${(error as Error).message})`, {
      cause: error,
    });
  }
  if (typeof document !== "object" || document === null || Array.isArray(document))
    throw new Error(`${source.file}: a schema must be a JSON object`);
  const record = document as Record<string, unknown>;
  const id = record.$id;
  if (typeof id !== "string") throw new Error(`${source.file}: no string "$id"`);
  const url = URL.canParse(id) ? new URL(id) : null;
  const expected = STATIC_HOSTS.map((host) => `https://${host}${SCHEMAS_PATH}/<name>.json`).join(
    " or ",
  );
  if (
    url?.protocol !== "https:" ||
    !STATIC_HOSTS.includes(url.host) ||
    url.search ||
    url.hash ||
    !url.pathname.startsWith(`${SCHEMAS_PATH}/`) ||
    !url.pathname.endsWith(".json")
  )
    throw new Error(`${source.file}: "$id" must be ${expected}, got ${id}`);
  const name = url.pathname.slice(SCHEMAS_PATH.length);
  const first = name.split("/")[1] ?? "";
  if (RESERVED_SEGMENT.test(first))
    throw new Error(`${source.file}: "$id" may not use the reserved segment "${first}"`);
  const title = typeof record.title === "string" ? record.title : url.pathname;
  return { name, host: url.host, title, document: record };
}
