/**
 * Stackra file contract:
 * Purpose: `contractsOnlyManifest`, what a package contributes to a member that imports it only through its
 *          `./contracts` entry: the integration events whose file is in `src/contracts/`, so the host's outbox and
 *          topic emitters know their wire names, and nothing else (no models, entities, migrations, actions,
 *          drivers, roles or permissions).
 * Boundary: pure; the manifest is the input, never the package's source.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15 and its 2026-11-07 note: a contracts-only dependency is not hosted);
 *                     STA-2567.
 */
import type { StackraManifest } from "@stackra/contracts";

import { entryOf } from "#core/functions/entry-of.function";

/**
 * The part of `manifest` a contracts-only host carries.
 *
 * @example
 * contractsOnlyManifest(workflowManifest).events?.map((event) => event.name); // ["workflow.service.acked.v1"]
 */
export function contractsOnlyManifest(manifest: StackraManifest): StackraManifest {
  const events = (manifest.events ?? []).filter(
    (event) => event.kind === "integration" && entryOf(String(event["file"])) === "contracts",
  );
  return {
    member: manifest.member,
    package: manifest.package,
    version: manifest.version,
    ...(events.length > 0 ? { events } : {}),
  };
}
