/**
 * Stackra file contract:
 * Purpose: `runAccountingCase(make, recorded)`, the recorded-case runner every accounting driver passes: it builds the
 *          driver over a replay of the case's recording, posts the journal twice through `postJournal` (the second
 *          must find the first and post nothing), reads the chart when the case has one, and checks every recorded
 *          call was made.
 * Boundary: names no vendor and asserts the `AccountingProvider` contract only; the driver's request shapes are what
 *           its recording pins. Throws a `TypeError` naming the case and the step on the first difference, so it runs
 *           under any test runner. `./testing` only (ADR 0269 decision 3).
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0443 (decision 8); owner D3 2026-10-27; STA-794 (balanced journals
 *                     posted idempotently).
 */
import { isDeepStrictEqual } from "node:util";

import type { AccountingProvider, PostedJournal } from "#contracts/index";
import { postJournal } from "#core/index";
import type { IntegrationApi } from "#core/index";
import type { AccountingCase } from "#testing/accounting/accounting-case.type";
import { replayIntegrationApi } from "#testing/accounting/replay-integration-api.function";

/** Throws unless `actual` equals `expected`. */
function same(recorded: AccountingCase, step: string, actual: unknown, expected: unknown): void {
  if (!isDeepStrictEqual(actual, expected))
    throw new TypeError(`Accounting case "${recorded.name}": ${step} differs from the recording`);
}

/**
 * Runs one recorded case against the driver `make` builds.
 *
 * @param make - builds the driver over the managed client it is given (the Connection's `api` in production).
 * @returns the journal the driver returned.
 * @throws TypeError naming the case and the step that differs, or the recorded call never made.
 * @example
 * await runAccountingCase((api) => new LedgerAccounting(api), issued);
 */
export async function runAccountingCase(
  make: (api: IntegrationApi) => AccountingProvider,
  recorded: AccountingCase,
): Promise<PostedJournal> {
  const api = replayIntegrationApi(recorded.name, recorded.exchanges);
  const provider = make(api);
  const first = await postJournal(provider, recorded.entry, recorded.idempotencyKey);
  same(recorded, "the posted journal", first, recorded.journal);
  const again = await postJournal(provider, recorded.entry, recorded.idempotencyKey);
  same(recorded, "the journal found again", again, recorded.journal);
  if (recorded.accounts !== undefined)
    same(recorded, "the chart of accounts", await provider.accounts(), recorded.accounts);
  api.done();
  return first;
}
