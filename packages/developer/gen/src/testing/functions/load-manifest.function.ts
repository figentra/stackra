/**
 * Stackra file contract:
 * Purpose: `loadManifest`, how a contract test reads a member's committed `stackra.manifest.json`, with every section
 *          present (an absent one is empty), resolved from the working directory (the member root under vitest).
 * Boundary: reads one file; never writes. A missing or invalid file rejects with the path in the message.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 10 and 22); ADR 0269 (manifest helpers in @stackra/gen/testing).
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { LoadedManifest } from "#testing/types/loaded-manifest.type";

/**
 * The manifest at `path`.
 *
 * @param path - the manifest file, relative to the working directory or absolute.
 * @throws Error when the file is missing or not a manifest.
 * @example
 * const manifest = await loadManifest("./stackra.manifest.json");
 * manifest.events.find((event) => event.name === "orders.order.paid.v1")?.broadcast?.permission;
 */
export async function loadManifest(path: string): Promise<LoadedManifest> {
  const file = resolve(path);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`cannot read the manifest ${file}: ${(error as Error).message}`, {
      cause: error,
    });
  }
  if (typeof parsed["member"] !== "string" || typeof parsed["package"] !== "string")
    throw new Error(`${file} is not a stackra.manifest.json (no member or package)`);
  return {
    ...parsed,
    member: parsed["member"],
    package: parsed["package"],
    version: typeof parsed["version"] === "string" ? parsed["version"] : "0.0.0",
    modules: [],
    actions: [],
    events: [],
    permissions: [],
    errors: [],
    models: [],
    drivers: [],
    schemas: {},
    ...Object.fromEntries(
      ["modules", "actions", "events", "permissions", "errors", "models", "drivers", "schemas"]
        .filter((section) => parsed[section] !== undefined)
        .map((section) => [section, parsed[section]]),
    ),
  } as LoadedManifest;
}
