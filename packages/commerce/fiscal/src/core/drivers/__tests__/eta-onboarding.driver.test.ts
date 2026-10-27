/**
 * Stackra file contract:
 * Purpose: unit tests of `EtaOnboardingDriver`: the token request built from the portal's values, the credential
 *          stored at compliance and then production without the access token, and the refusals.
 * Boundary: test only; the transport and credential store are fakes and the options and values are samples.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364 (decision 4).
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import type { TransportRequest } from "#contracts/types/transport-request.type";
import { EtaOnboardingDriver } from "#core/drivers/eta-onboarding.driver";
import { FiscalAuthorityUnavailableError } from "#core/errors/fiscal-authority-unavailable.error";
import { FiscalCredentialMissingError } from "#core/errors/fiscal-credential-missing.error";
import { FiscalOnboardingInputMissingError } from "#core/errors/fiscal-onboarding-input-missing.error";
import { FiscalOnboardingRefusedError } from "#core/errors/fiscal-onboarding-refused.error";
import { FiscalTransportFake } from "#testing/fiscal-transport.fake";
import { TillCredentialsFake } from "#testing/till-credentials.fake";

const OPTIONS = {
  tokenUrl: "https://id.authority.test/connect/token",
  submitUrl: "https://x.test",
};
const ANSWERS = {
  client_id: "CID",
  client_secret: "CSECRET",
  preshared_key: "PSK",
  device_serial: "SN1",
  device_os_version: "android 14",
};
const TOKEN = { status: 200, headers: {}, body: '{"access_token":"AT","expires_in":3600}' };

describe("EtaOnboardingDriver", () => {
  it("proves the portal's values and stores them at compliance without the access token", async () => {
    const transport = FiscalTransportFake.answering(TOKEN);
    const credentials = new TillCredentialsFake();
    const onboarding = new EtaOnboardingDriver(transport, credentials);
    expect([onboarding.key, onboarding.inputs.length]).toEqual(["eta-receipt", 5]);
    expect(await onboarding.register("till_1", ANSWERS, OPTIONS)).toEqual({
      unitId: "till_1",
      stage: "compliance",
      requestId: null,
    });
    const [request] = transport.calls("send") as TransportRequest[];
    expect([request?.url, request?.credential, request?.headers]).toEqual([
      OPTIONS.tokenUrl,
      null,
      {
        "Content-Type": "application/x-www-form-urlencoded",
        posserial: "SN1",
        pososversion: "android 14",
        presharedkey: "PSK",
      },
    ]);
    expect(Object.fromEntries(new URLSearchParams(request?.body ?? ""))).toEqual({
      grant_type: "client_credentials",
      client_id: "CID",
      client_secret: "CSECRET",
    });
    const stored = await credentials.get("till_1");
    expect(stored).toEqual({
      unitId: "till_1",
      stage: "compliance",
      requestId: null,
      token: "CID",
      secret: "CSECRET",
      certificate: null,
      certificateSerial: null,
      attributes: { preshared_key: "PSK", device_serial: "SN1", device_os_version: "android 14" },
    });
  });

  it("proves the stored values again on complete and marks them production", async () => {
    const transport = FiscalTransportFake.answering(TOKEN, TOKEN);
    const credentials = new TillCredentialsFake();
    const onboarding = new EtaOnboardingDriver(transport, credentials);
    await onboarding.register("till_1", ANSWERS, OPTIONS);
    expect(await onboarding.complete("till_1", OPTIONS)).toEqual({
      unitId: "till_1",
      stage: "production",
      requestId: null,
    });
    const [first, second] = transport.calls("send") as TransportRequest[];
    expect(second).toEqual(first);
    expect((await credentials.get("till_1"))?.stage).toBe("production");
  });

  it("refuses complete without a compliance credential", async () => {
    await expect(
      new EtaOnboardingDriver(FiscalTransportFake.answering(), new TillCredentialsFake()).complete(
        "till_1",
        OPTIONS,
      ),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, FiscalCredentialMissingError));
  });

  it("refuses a missing answer before calling the authority", async () => {
    const transport = FiscalTransportFake.answering();
    await expect(
      new EtaOnboardingDriver(transport, new TillCredentialsFake()).register(
        "till_1",
        { ...ANSWERS, preshared_key: "" },
        OPTIONS,
      ),
    ).rejects.toSatisfy(
      (error: unknown) =>
        isRefusal(error, FiscalOnboardingInputMissingError) &&
        error.details.input === "preshared_key",
    );
    expect(transport.calls("send")).toEqual([]);
  });

  it.each([
    { status: 400, body: '{"error":"invalid_client"}' },
    { status: 401, body: "" },
    { status: 200, body: "not json" },
  ])("refuses an identity answer of $status and stores nothing", async ({ status, body }) => {
    const credentials = new TillCredentialsFake();
    await expect(
      new EtaOnboardingDriver(
        FiscalTransportFake.answering({ status, headers: {}, body }),
        credentials,
      ).register("till_1", ANSWERS, OPTIONS),
    ).rejects.toSatisfy(
      (error: unknown) =>
        isRefusal(error, FiscalOnboardingRefusedError) && error.details.status === status,
    );
    expect(credentials.calls("save")).toEqual([]);
  });

  it("reports an identity service that does not answer as unavailable", async () => {
    await expect(
      new EtaOnboardingDriver(
        FiscalTransportFake.answering({ status: 503, headers: {}, body: "" }),
        new TillCredentialsFake(),
      ).register("till_1", ANSWERS, OPTIONS),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, FiscalAuthorityUnavailableError));
  });
});
