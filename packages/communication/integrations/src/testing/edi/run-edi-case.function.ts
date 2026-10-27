/**
 * Stackra file contract:
 * Purpose: `runEdiCase(make, recorded)`, the recorded-case runner every EDI connector passes: it builds the connector
 *          over a replay of the case's recording, sends each document twice under its key (the same id both times),
 *          reads every page since the case's date, compares the documents, acknowledges each and checks every
 *          recorded call was made.
 * Boundary: names no vendor and asserts the `EdiConnector` contract only; the connector's request shapes are what its
 *           recording pins. Throws a `TypeError` naming the case and the step on the first difference, so it runs
 *           under any test runner. `./testing` only (ADR 0269 decision 3).
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0443 (decision 8); ADR 0447 (decision 4); owner D3 2026-10-27;
 *                     STA-795 (PO in, invoice and ASN out for one trading partner).
 */
import { isDeepStrictEqual } from "node:util";

import type { EdiConnector, EdiDocument } from "#contracts/index";
import type { IntegrationApi } from "#core/index";
import { replayIntegrationApi } from "#testing/accounting/replay-integration-api.function";
import type { EdiCase } from "#testing/edi/edi-case.type";

/** Throws unless `actual` equals `expected`. */
function same(recorded: EdiCase, step: string, actual: unknown, expected: unknown): void {
  if (!isDeepStrictEqual(actual, expected))
    throw new TypeError(`EDI case "${recorded.name}": ${step} differs from the recording`);
}

/**
 * Runs one recorded case against the connector `make` builds.
 *
 * @param make - builds the connector over the managed client it is given (the Connection's `api` in production).
 * @returns the documents received.
 * @throws TypeError naming the case and the step that differs, or the recorded call never made.
 * @example
 * await runEdiCase((api) => new VanEdiConnector(api), po);
 */
export async function runEdiCase(
  make: (api: IntegrationApi) => EdiConnector,
  recorded: EdiCase,
): Promise<readonly EdiDocument[]> {
  const api = replayIntegrationApi(recorded.name, recorded.exchanges);
  const connector = make(api);
  for (const { document, idempotencyKey, id } of recorded.sends) {
    same(recorded, `send ${idempotencyKey}`, await connector.send(document, idempotencyKey), {
      id,
    });
    same(recorded, `send ${idempotencyKey} again`, await connector.send(document, idempotencyKey), {
      id,
    });
  }
  const documents: EdiDocument[] = [];
  let cursor: string | undefined;
  do {
    const page = await connector.receive(recorded.since, cursor);
    documents.push(...page.documents);
    cursor = page.next;
  } while (cursor !== undefined);
  same(recorded, "the received documents", documents, recorded.received);
  for (const document of documents) {
    if (document.id === undefined)
      throw new TypeError(`EDI case "${recorded.name}": a received document has no id`);
    await connector.acknowledge(document.id);
  }
  api.done();
  return documents;
}
