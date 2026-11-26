/**
 * Stackra file contract:
 * Purpose: `integrationWireNames`, the wire names of the integration events a manifest publishes, sorted and unique:
 *          a service's own and its hosted packages', as its outbox publishes them.
 * Boundary: pure; reads the manifest's `events` only. The events target declares one topic per name, and the boot
 *           hands the same list to the outbox relay, which refuses any other wire name (STA-1792).
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (decision 2: wire names); ADR 0509 (decision 7) and ADR 0511 (decision 11: the
 *                     verified producer).
 */
import type { StackraManifest } from "@stackra/contracts";

/**
 * The integration event wire names `manifest` publishes, sorted.
 *
 * @example
 * integrationWireNames(manifest); // ["orders.order.paid.v1"]
 */
export function integrationWireNames(manifest: StackraManifest): string[] {
  return [
    ...new Set(
      (manifest.events ?? [])
        .filter((event) => event.kind === "integration" && typeof event["name"] === "string")
        .map((event) => String(event["name"])),
    ),
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  ].sort();
}
