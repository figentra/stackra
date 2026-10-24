/**
 * Stackra file contract:
 * Purpose: `loadOpenApi`, how a contract test reads a member's committed `openapi.json`, to compare it with
 *          `projectOpenApi` of the committed manifest.
 * Boundary: reads one file; never writes. A missing or invalid file rejects with the path in the message.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 10: openapi.json beside the manifest); ADR 0158.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { OpenApiDocument } from "#core/types/open-api-document.type";

/**
 * The OpenAPI document at `path`.
 *
 * @param path - the file, relative to the working directory or absolute.
 * @throws Error when the file is missing or not an OpenAPI document.
 * @example
 * expect(await projectOpenApi(manifest)).toEqual(await loadOpenApi("./openapi.json"));
 */
export async function loadOpenApi(path: string): Promise<OpenApiDocument> {
  const file = resolve(path);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`cannot read the OpenAPI document ${file}: ${(error as Error).message}`, {
      cause: error,
    });
  }
  if (typeof parsed["openapi"] !== "string")
    throw new Error(`${file} is not an OpenAPI document (no \`openapi\`)`);
  return parsed as unknown as OpenApiDocument;
}
