/**
 * Stackra file contract:
 * Purpose: `deliverableEvents`, the webhook event catalogue of one member release: a row for each event the manifest
 *          opts in with `webhook: true` (thin when it declares a personal-data class), and a withdrawn row for each
 *          event the previous release offered and this one no longer does.
 * Boundary: pure; never throws. Reads validated manifests (`CatalogueManifest`); the registry service sends the rows
 *           to the webhooks service, which owns the catalogue table. Rows are sorted by wire name, by code unit.
 * Runtime: isomorphic
 * Governing contract: ADR 0224 (webhooks); ADR 0134 (personal-data classes); OS-210, OS-212.
 */
import { DeliverablePayload } from "#core/enums/deliverable-payload.enum";
import type { CatalogueManifest } from "#core/schemas/catalogue-manifest.schema";
import type { DeliverableEventRow } from "#core/types/deliverable-event-row.type";

/** The opt-in rows of `manifest`, by wire name. */
const rowsOf = (manifest: Pick<CatalogueManifest, "events">): Map<string, DeliverableEventRow> =>
  new Map(
    manifest.events
      .filter((event) => event.webhook === true)
      .map((event) => [
        event.name,
        (event.dataClasses ?? []).length > 0
          ? {
              type: event.name,
              payload: DeliverablePayload.Thin,
              thinFields: [...(event.thinFields ?? [])],
            }
          : { type: event.name, payload: DeliverablePayload.Full },
      ]),
  );

/**
 * The catalogue rows to register for `manifest`, given the member's `previous` release when there is one.
 *
 * @example
 * for (const row of deliverableEvents(incoming, stored)) await webhooks.registerDeliverableEvent(row);
 */
export function deliverableEvents(
  manifest: Pick<CatalogueManifest, "events">,
  previous?: Pick<CatalogueManifest, "events">,
): DeliverableEventRow[] {
  const rows = rowsOf(manifest);
  const withdrawn = [...rowsOf(previous ?? { events: [] }).values()]
    .filter((row) => !rows.has(row.type))
    .map((row): DeliverableEventRow => ({ ...row, withdrawn: true }));
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return [...rows.values(), ...withdrawn].sort((a, b) =>
    a.type < b.type ? -1 : a.type > b.type ? 1 : 0,
  );
}
