/**
 * Stackra file contract:
 * Purpose: `runPayoutCase(gateway, case)`, the recorded-fixture harness for `PayoutGateway` Connections: runs one case
 *          and checks the answer against what was recorded and against the port's rules (a non-empty provider id, a
 *          `TransferStatus` code, a lost answer refused as `provider_unavailable`, a declined payout answered `failed`).
 * Boundary: a test helper in the `./testing` entry, vendor-neutral. The caller builds the Connection over its recorded
 *           transport (OS integrations: `fakeIntegrationApi` of `@stackra/integrations/testing`), so this helper reads
 *           no network, config or secret. A thrown error other than a refusal is a gateway bug and is rethrown.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 2 and 6); ADR 0443 (decisions 7 and 8); ADR 0269; owner decision D3
 *                     (2026-10-27): certification pending until a sandbox run passes.
 */
import { Enum } from "@stackra/contracts";

import { TransferStatus } from "#contracts/enums/transfer-status.enum";
import type { PayoutGateway } from "#contracts/types/payout-gateway.type";
import type { TransferResult } from "#contracts/types/transfer-result.type";
import type { GatewayCaseResult } from "#testing/gateway-case-result.type";
import type { PayoutCase } from "#testing/payout-case.type";
import { refusalMismatches } from "#testing/refusal-mismatches.function";

/** Every port rule or expectation `answer` misses. */
function mismatchesOf(certification: PayoutCase, answer: TransferResult): string[] {
  const { expect } = certification;
  const missed: string[] = [];
  if (expect.lost) missed.push("lost: expected a provider_unavailable refusal, got an answer");
  if (expect.refused !== undefined)
    missed.push(`refused: expected ${expect.refused}, got an answer`);
  if (typeof answer.providerRef !== "string" || answer.providerRef.length === 0)
    missed.push("providerRef: empty");
  if (!(Enum.values(TransferStatus) as readonly string[]).includes(answer.status))
    missed.push(`status: ${String(answer.status)} is not a TransferStatus code`);
  if (expect.status !== undefined && answer.status !== expect.status)
    missed.push(`status: expected ${expect.status}, got ${answer.status}`);
  if (expect.providerRef !== undefined && answer.providerRef !== expect.providerRef)
    missed.push(`providerRef: expected ${expect.providerRef}, got ${answer.providerRef}`);
  return missed;
}

/**
 * Runs `certification` through `gateway` on its recorded exchange.
 *
 * @example
 * const api = fakeIntegrationApi({ "POST /v1/payouts": { status: 201, body: recorded } });
 * const result = await runPayoutCase(new VendorConnection(api.connection), VENDOR_PAYOUT_CASES[0]);
 * expect(result.mismatches).toEqual([]);
 * @throws the gateway's error when it throws anything other than a refusal.
 */
export async function runPayoutCase(
  gateway: PayoutGateway,
  certification: PayoutCase,
): Promise<GatewayCaseResult<TransferResult>> {
  const caseId = certification.id;
  let answer: TransferResult;
  try {
    answer = await gateway.payout(certification.request);
  } catch (error) {
    return { caseId, answer: null, mismatches: refusalMismatches(error, certification.expect) };
  }
  return { caseId, answer, mismatches: mismatchesOf(certification, answer) };
}
