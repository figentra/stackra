/**
 * Stackra file contract:
 * Purpose: unit tests of `signUsageReport`: the exported report carries the payload's fields and a signature the
 *          registered install key verifies over `usageReportMessage`; an edit after signing fails verification; extra
 *          fields are not signed; a backwards period or a fractional or negative line is refused.
 * Boundary: test only; keys are generated per run.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0178 (decision 5); ADR 0416; OS ADR 0039 d8.
 */
import { verifySignature } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { generateInstallKey } from "#core/functions/generate-install-key.function";
import { installSigner } from "#core/functions/install-signer.function";
import { signUsageReport } from "#core/functions/sign-usage-report.function";
import { usageReportMessage } from "#core/functions/usage-report-message.function";
import type { UsageReportPayload } from "#core/types/usage-report-payload.type";

const payload: UsageReportPayload = {
  version: 1,
  licenceId: "lic-1",
  periodStart: "2027-01-01T00:00:00.000Z",
  periodEnd: "2027-04-01T00:00:00.000Z",
  lines: { seats: 12 },
};

describe("signUsageReport", () => {
  it("exports a report the registered key verifies, and an edit breaks", async () => {
    const key = await generateInstallKey("acme-onprem-1");
    const report = await signUsageReport(
      payload,
      await installSigner("acme-onprem-1", key.privateKey),
    );
    const { signature, ...signed } = report;
    expect(signed).toEqual(payload);
    expect(await verifySignature(key.publicKey, usageReportMessage(signed), signature)).toBe(true);
    const edited = usageReportMessage({ ...signed, lines: { seats: 1 } });
    expect(await verifySignature(key.publicKey, edited, signature)).toBe(false);
  });

  it("signs only the payload's fields", async () => {
    const key = await generateInstallKey("k");
    const extra = { ...payload, note: "hello" } as UsageReportPayload;
    const report = await signUsageReport(extra, await installSigner("k", key.privateKey));
    expect("note" in report).toBe(false);
  });

  it.each([
    [{ periodEnd: payload.periodStart }],
    [{ lines: { seats: 1.5 } }],
    [{ lines: { seats: -1 } }],
  ])("refuses %j", async (change) => {
    const key = await generateInstallKey("k");
    const signer = await installSigner("k", key.privateKey);
    await expect(signUsageReport({ ...payload, ...change }, signer)).rejects.toBeInstanceOf(
      RangeError,
    );
  });
});
