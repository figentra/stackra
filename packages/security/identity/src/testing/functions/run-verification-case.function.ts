/**
 * Stackra file contract:
 * Purpose: `runVerificationCase(driver, case)`, the recorded-fixture harness for `Verification` drivers: runs one case
 *          and checks the answer against what was recorded and against the port's rules (the kind is supported, an
 *          outage refuses `verification_unavailable`, reasons are stable snake_case codes and empty when verified,
 *          `checkedAt` is a real time, and no subject fact is echoed back).
 * Boundary: a test helper in the `./testing` entry, vendor-neutral. The caller builds the driver over its recorded
 *           transport (OS integrations: `fakeIntegrationApi` of `@stackra/integrations/testing`), so this helper reads
 *           no network, config or secret. A thrown error other than a refusal is a driver bug and is rethrown.
 * Runtime: isomorphic
 * Governing contract: Stackra 0357 (decision 7); OS-54; ADR 0443 (decisions 7 and 8); ADR 0269 (decision 3); owner
 *                     decision D3 (2026-10-27): certification pending until a sandbox run passes.
 */
import type { Json } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";

import { VerificationStatus } from "#contracts/index";
import type { Verification, VerificationResult } from "#contracts/index";
import type { VerificationCaseResult } from "#testing/types/verification-case-result.type";
import type { VerificationCase } from "#testing/types/verification-case.type";

/** A stable reason code. */
const REASON_CODE = /^[a-z][a-z0-9_]*$/;

/** Facts shorter than this are too common to flag as an echo (`m`, `sa`, `1`). */
const MIN_FACT_LENGTH = 4;

/** Every string and number in `value`, as text. */
function factsOf(value: Json | undefined): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "number") return [String(value)];
  if (Array.isArray(value)) return value.flatMap((item) => factsOf(item));
  if (typeof value === "object" && value !== null)
    return Object.values(value).flatMap((item) => factsOf(item));
  return [];
}

/** Every port rule or expectation `answer` misses. */
function mismatchesOf(
  certification: VerificationCase,
  answer: Omit<VerificationResult, "provider">,
): string[] {
  const { expect, request } = certification;
  const missed: string[] = [];
  if (expect.unavailable)
    missed.push("unavailable: expected a verification_unavailable refusal, got an answer");
  if (expect.status !== undefined && answer.status !== expect.status)
    missed.push(`status: expected ${expect.status}, got ${answer.status}`);
  if (
    expect.providerReference !== undefined &&
    answer.providerReference !== expect.providerReference
  )
    missed.push(
      `providerReference: expected ${expect.providerReference}, got ${answer.providerReference ?? "none"}`,
    );
  if (!(answer.checkedAt instanceof Date) || Number.isNaN(answer.checkedAt.getTime()))
    missed.push("checkedAt: not a valid time");
  for (const reason of answer.reasons)
    if (!REASON_CODE.test(reason)) missed.push(`reasons: ${reason} is not a snake_case code`);
  if (answer.status === VerificationStatus.Verified && answer.reasons.length > 0)
    missed.push("reasons: a verified check carries none");
  if (expect.reasons !== undefined) {
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    const got = [...answer.reasons].sort().join(",");
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    const want = [...expect.reasons].sort().join(",");
    if (got !== want) missed.push(`reasons: expected [${want}], got [${got}]`);
  }
  const text = JSON.stringify(answer);
  const echoed = Object.entries(request.subject).filter(([, value]) =>
    factsOf(value).some((fact) => fact.length >= MIN_FACT_LENGTH && text.includes(fact)),
  );
  // Names the field only, never the fact (personal data).
  for (const [field] of echoed) missed.push(`subject: the answer echoes ${field}`);
  return missed;
}

/**
 * Runs `certification` through `driver` on its recorded exchange.
 *
 * @example
 * const api = fakeIntegrationApi({ "POST /v2/session": { status: 200, body: recorded } });
 * const result = await runVerificationCase(new VendorVerificationDriver(api.connection), VENDOR_CASES[0]);
 * expect(result.mismatches).toEqual([]);
 * @throws the driver's error when it throws anything other than a refusal.
 */
export async function runVerificationCase(
  driver: Verification,
  certification: VerificationCase,
): Promise<VerificationCaseResult> {
  const { id: caseId, request, expect } = certification;
  if (!driver.supports(request.kind))
    return {
      caseId,
      answer: null,
      mismatches: [`supports: the driver does not answer ${request.kind}`],
    };
  let answer: Omit<VerificationResult, "provider">;
  try {
    answer = await driver.verify(request);
  } catch (error) {
    if (!isRefusal(error)) throw error;
    const unavailable = error.code === "verification_unavailable";
    const mismatches =
      unavailable && expect.unavailable
        ? []
        : [`refused: ${error.code}${unavailable ? " (no outage was recorded)" : ""}`];
    return { caseId, answer: null, mismatches };
  }
  return { caseId, answer, mismatches: mismatchesOf(certification, answer) };
}
