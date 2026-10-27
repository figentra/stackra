/**
 * Stackra file contract:
 * Purpose: `runDisputeCase(gateway, case)`, the recorded-fixture harness for `DisputeGateway` Connections: runs one
 *          read, respond or accept and checks the answer against what was recorded and against the port's rules (the
 *          dispute asked is the one answered, a `DisputeStatus` code, a reason, a positive amount, a valid due date, a
 *          response leaves `needs_response`, an accept ends `accepted` or `lost`, a lost answer refused as
 *          `provider_unavailable`).
 * Boundary: a test helper in the `./testing` entry, vendor-neutral. The caller builds the Connection over its recorded
 *           transport, so this helper reads no network, config or secret. A thrown error other than a refusal is a
 *           gateway bug and is rethrown.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (Enforcement: the dispute port; decision 6); ADR 0443 (decisions 7 and 8); ADR 0269;
 *                     owner decision D3 (2026-10-27): certification pending until a sandbox run passes.
 */
import { Enum } from "@stackra/contracts";

import { DisputeStatus } from "#contracts/enums/dispute-status.enum";
import type { Dispute } from "#contracts/types/dispute.type";
import type { DisputeGateway } from "#contracts/types/dispute-gateway.type";
import type { DisputeCase } from "#testing/dispute-case.type";
import type { GatewayCaseResult } from "#testing/gateway-case-result.type";
import { refusalMismatches } from "#testing/refusal-mismatches.function";

/** The states each step may end in. */
const ENDS: Readonly<Record<DisputeCase["step"], readonly DisputeStatus[] | undefined>> = {
  read: undefined,
  respond: [DisputeStatus.UnderReview, DisputeStatus.Won, DisputeStatus.Lost],
  // A provider may close an accepted dispute as lost (Stripe's close does).
  accept: [DisputeStatus.Accepted, DisputeStatus.Lost],
};

/** Every port rule or expectation `answer` misses. */
function mismatchesOf(certification: DisputeCase, answer: Dispute): string[] {
  const { expect, step, providerRef } = certification;
  const missed: string[] = [];
  if (expect.lost) missed.push("lost: expected a provider_unavailable refusal, got an answer");
  if (expect.refused !== undefined)
    missed.push(`refused: expected ${expect.refused}, got an answer`);
  if (answer.providerRef !== providerRef)
    missed.push(`providerRef: asked ${providerRef}, got ${answer.providerRef}`);
  if (!(Enum.values(DisputeStatus) as readonly string[]).includes(answer.status))
    missed.push(`status: ${String(answer.status)} is not a DisputeStatus code`);
  const ends = ENDS[step];
  if (ends !== undefined && !ends.includes(answer.status))
    missed.push(`status: ${step} cannot end ${answer.status}`);
  if (typeof answer.reason !== "string" || answer.reason.length === 0) missed.push("reason: empty");
  if (!(answer.amount.minor > 0)) missed.push("amount: not positive");
  if (
    answer.respondBy !== undefined &&
    (!(answer.respondBy instanceof Date) || Number.isNaN(answer.respondBy.getTime()))
  )
    missed.push("respondBy: not a valid time");
  if (expect.status !== undefined && answer.status !== expect.status)
    missed.push(`status: expected ${expect.status}, got ${answer.status}`);
  if (expect.paymentRef !== undefined && answer.paymentRef !== expect.paymentRef)
    missed.push(`paymentRef: expected ${expect.paymentRef}, got ${answer.paymentRef}`);
  if (
    expect.amount !== undefined &&
    (answer.amount.minor !== expect.amount.minor ||
      answer.amount.currency !== expect.amount.currency)
  )
    missed.push(
      `amount: expected ${expect.amount.minor} ${expect.amount.currency}, got ${answer.amount.minor} ${answer.amount.currency}`,
    );
  if (expect.reason !== undefined && answer.reason !== expect.reason)
    missed.push(`reason: expected ${expect.reason}, got ${answer.reason}`);
  if (expect.respondBy !== undefined && answer.respondBy?.getTime() !== expect.respondBy.getTime())
    missed.push(
      `respondBy: expected ${expect.respondBy.toISOString()}, got ${answer.respondBy?.toISOString() ?? "none"}`,
    );
  return missed;
}

/**
 * Runs `certification` through `gateway` on its recorded exchange.
 *
 * @example
 * const result = await runDisputeCase(new VendorConnection(api.connection), VENDOR_DISPUTE_CASES[0]);
 * expect(result.mismatches).toEqual([]);
 * @throws TypeError when a `respond` case has no evidence; the gateway's error when it is not a refusal.
 */
export async function runDisputeCase(
  gateway: DisputeGateway,
  certification: DisputeCase,
): Promise<GatewayCaseResult<Dispute>> {
  const { id: caseId, step, providerRef, evidence } = certification;
  if (step === "respond" && evidence === undefined)
    throw new TypeError(`runDisputeCase: ${caseId} responds without evidence`);
  let answer: Dispute;
  try {
    answer =
      step === "read"
        ? await gateway.dispute(providerRef)
        : step === "accept"
          ? await gateway.accept(providerRef)
          : await gateway.respond(providerRef, evidence ?? { text: "" });
  } catch (error) {
    return { caseId, answer: null, mismatches: refusalMismatches(error, certification.expect) };
  }
  return { caseId, answer, mismatches: mismatchesOf(certification, answer) };
}
