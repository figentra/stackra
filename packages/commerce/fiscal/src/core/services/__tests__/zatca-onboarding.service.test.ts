/**
 * Stackra file contract:
 * Purpose: unit tests of `ZatcaOnboarding`: the compliance CSID from a CSR and OTP, the compliance check of a sample
 *          record, the production CSID exchange, the stored credential never returned, and the refusals.
 * Boundary: test only; the transport and credential store are fakes and the options are samples.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364 (decision 4).
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import type { TransportRequest } from "#contracts/types/transport-request.type";
import { FiscalCredentialMissingError } from "#core/errors/fiscal-credential-missing.error";
import { FiscalOnboardingRefusedError } from "#core/errors/fiscal-onboarding-refused.error";
import { ZatcaOnboarding } from "#core/services/zatca-onboarding.service";
import { fiscalRecord } from "#testing/fiscal-record.fixture";
import { FiscalTransportFake } from "#testing/fiscal-transport.fake";
import { TillCredentialsFake } from "#testing/till-credentials.fake";

const OPTIONS = {
  reportingUrl: "https://authority.test/reporting",
  clearanceUrl: "https://authority.test/clearance",
  complianceCsidUrl: "https://authority.test/compliance",
  complianceInvoicesUrl: "https://authority.test/compliance/invoices",
  productionCsidUrl: "https://authority.test/production",
  apiVersion: "V2",
  profileId: "reporting:1.0",
  taxCurrency: "EUR",
  paymentMeans: { cash: "10" },
  timeZone: "UTC",
};
const issued = (requestID: number) => ({
  status: 200,
  headers: {},
  body: JSON.stringify({ requestID, binarySecurityToken: "TOKEN", secret: "SECRET" }),
});

describe("ZatcaOnboarding", () => {
  it("stores a compliance CSID and returns only its public facts", async () => {
    const transport = FiscalTransportFake.answering(issued(11));
    const credentials = new TillCredentialsFake();
    const result = await new ZatcaOnboarding(transport, credentials).compliance(
      "till_1",
      "CSR",
      "123456",
      OPTIONS,
    );
    const [request] = transport.calls("send") as TransportRequest[];
    expect(result).toEqual({ unitId: "till_1", stage: "compliance", requestId: "11" });
    expect([request?.url, request?.credential, request?.headers.OTP, request?.body]).toEqual([
      OPTIONS.complianceCsidUrl,
      null,
      "123456",
      '{"csr":"CSR"}',
    ]);
    expect(await credentials.get("till_1")).toMatchObject({
      stage: "compliance",
      token: "TOKEN",
      secret: "SECRET",
    });
  });

  it("checks a sample record against the compliance endpoint", async () => {
    const transport = FiscalTransportFake.answering({ status: 200, headers: {}, body: "{}" });
    const outcome = await new ZatcaOnboarding(transport, new TillCredentialsFake()).check(
      "till_1",
      fiscalRecord(),
      OPTIONS,
    );
    const [request] = transport.calls("send") as TransportRequest[];
    expect([request?.url, request?.credential, outcome.status]).toEqual([
      OPTIONS.complianceInvoicesUrl,
      "till_1",
      FiscalRecordStatus.Accepted,
    ]);
  });

  it("exchanges the compliance CSID for a production CSID", async () => {
    const transport = FiscalTransportFake.answering(issued(11), issued(22));
    const credentials = new TillCredentialsFake();
    const onboarding = new ZatcaOnboarding(transport, credentials);
    await onboarding.compliance("till_1", "CSR", "123456", OPTIONS);
    expect(await onboarding.production("till_1", OPTIONS)).toEqual({
      unitId: "till_1",
      stage: "production",
      requestId: "22",
    });
    const [, request] = transport.calls("send") as TransportRequest[];
    expect([request?.url, request?.credential, request?.body]).toEqual([
      OPTIONS.productionCsidUrl,
      "till_1",
      '{"compliance_request_id":"11"}',
    ]);
  });

  it("refuses a production request without a compliance CSID", async () => {
    await expect(
      new ZatcaOnboarding(FiscalTransportFake.answering(), new TillCredentialsFake()).production(
        "till_1",
        OPTIONS,
      ),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, FiscalCredentialMissingError));
  });

  it("refuses when the authority refuses the OTP", async () => {
    const transport = FiscalTransportFake.answering({
      status: 400,
      headers: {},
      body: '{"errors":["Invalid OTP"]}',
    });
    const credentials = new TillCredentialsFake();
    await expect(
      new ZatcaOnboarding(transport, credentials).compliance("till_1", "CSR", "000000", OPTIONS),
    ).rejects.toSatisfy(
      (error: unknown) =>
        isRefusal(error, FiscalOnboardingRefusedError) && error.details.status === 400,
    );
    expect(credentials.calls("save")).toEqual([]);
  });
});
