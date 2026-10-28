/**
 * Stackra file contract:
 * Purpose: `projectOpenApi`, the `openapi.json` a manifest projects to, in the JSON form a committed file has (keys
 *          with an undefined value dropped), so a contract test proves the committed file was never edited by hand.
 * Boundary: pure apart from being async for the test's `await`; the projection itself is `openApiOf`.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 10); ADR 0158 (openapi.json is a projection of the manifest).
 */
import type { StackraManifest } from "@stackra/contracts";

import { openApiOf } from "#core/functions/open-api-of.function";
import type { OpenApiDocument } from "#core/types/open-api-document.type";

/**
 * The OpenAPI projection of `manifest`.
 *
 * @param manifest - a loaded manifest.
 * @example
 * expect(await projectOpenApi(next)).toEqual(await loadOpenApi("./openapi.json"));
 */
export function projectOpenApi(manifest: StackraManifest): Promise<OpenApiDocument> {
  // oxlint-disable-next-line unicorn/prefer-structured-clone -- a JSON round trip on purpose: it is what the wire does (Dates become strings, undefined and functions drop)
  return Promise.resolve(JSON.parse(JSON.stringify(openApiOf(manifest))) as OpenApiDocument);
}
