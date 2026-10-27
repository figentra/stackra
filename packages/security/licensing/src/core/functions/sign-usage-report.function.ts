/**
 * Stackra file contract:
 * Purpose: `signUsageReport`, the on-prem report exporter: signs a usage report with the install's `Signer` and returns
 *          the `SignedUsageReport` the operator uploads to the issuing service.
 * Boundary: signs exactly the payload's fields (`usageReportMessage`), never anything the caller adds. Refuses a period
 *           that does not move forward and a line that is not a whole, non-negative number, since the import would
 *           refuse it anyway. Never phones home: writing and moving the file is the caller's (ADR 0178 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decision 5); ADR 0416; OS ADR 0039 d8 (licensing SPEC open question 2).
 */
import type { Signer } from "@stackra/contracts";

import { usageReportMessage } from "#core/functions/usage-report-message.function";
import type { SignedUsageReport } from "#core/types/signed-usage-report.type";
import type { UsageReportPayload } from "#core/types/usage-report-payload.type";

/**
 * Signs one usage report.
 *
 * @throws RangeError when the period does not move forward or a line is not a whole, non-negative number.
 * @example
 * const signer = await installSigner("acme-onprem-1", secrets.LICENSING_INSTALL_KEY);
 * const report = await signUsageReport(
 *   { version: 1, licenceId, periodStart: "2027-01-01T00:00:00.000Z", periodEnd: "2027-04-01T00:00:00.000Z", lines },
 *   signer,
 * );
 * await writeFile("usage-report.json", JSON.stringify(report));
 */
export async function signUsageReport(
  payload: UsageReportPayload,
  signer: Signer,
): Promise<SignedUsageReport> {
  if (!(Date.parse(payload.periodEnd) > Date.parse(payload.periodStart)))
    throw new RangeError("a usage report's periodEnd must be after its periodStart");
  if (
    !Object.values(payload.lines).every((quantity) => Number.isInteger(quantity) && quantity >= 0)
  )
    throw new RangeError("a usage report's lines must be whole, non-negative numbers");
  const signed: UsageReportPayload = {
    version: payload.version,
    licenceId: payload.licenceId,
    periodStart: payload.periodStart,
    periodEnd: payload.periodEnd,
    lines: { ...payload.lines },
  };
  return { ...signed, signature: await signer.sign(usageReportMessage(signed)) };
}
