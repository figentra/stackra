/**
 * Stackra file contract:
 * Purpose: `ZatcaOnboarding`, a CSID per till: the unit's compliance CSID from its CSR and the taxpayer's one-time
 *          password, the compliance check of sample invoices, and the production CSID that replaces it.
 * Boundary: the `zatca` driver of `FiscalOnboarding` over `FiscalTransport` and `TillCredentials`; `register` and
 *           `complete` are `compliance` and `production` behind the port's generic answers. The CSR is made by the host's signer, so the
 *           private key never leaves it. Issued tokens and secrets go straight to the credential store and are never
 *           returned or logged. Endpoints and the version are the `zatca` pack options. Device pairing calls it
 *           (`@stackra/devices`, OS-118).
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 4 and 5).
 */
import { Driver } from "@stackra/container";
import { z } from "zod";

import { OnboardingInput } from "#contracts/enums/onboarding-input.enum";
import { FiscalOnboarding } from "#contracts/ports/fiscal-onboarding.port";
import type { FiscalTransport } from "#contracts/ports/fiscal-transport.port";
import type { TillCredentials } from "#contracts/ports/till-credentials.port";
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";
import type { OnboardingStep } from "#contracts/types/onboarding-step.type";
import type { SubmissionOutcome } from "#contracts/types/submission-outcome.type";
import type { TillCredential } from "#contracts/types/till-credential.type";
import { ZATCA_OPTIONS } from "#core/constants/zatca-options.constant";
import { FiscalCredentialMissingError } from "#core/errors/fiscal-credential-missing.error";
import { FiscalOnboardingRefusedError } from "#core/errors/fiscal-onboarding-refused.error";
import { assertAnswered } from "#core/functions/assert-answered.function";
import { onboardingAnswers } from "#core/functions/onboarding-answers.function";
import { parseOptions } from "#core/functions/parse-options.function";
import { zatcaOutcome } from "#core/functions/zatca-outcome.function";
import { zatcaRequest } from "#core/functions/zatca-request.function";

/** The authority's CSID answer. */
const CSID_ANSWER = z.object({
  requestID: z.union([z.string(), z.number()]),
  binarySecurityToken: z.string().min(1),
  secret: z.string().min(1),
});

/** The driver key the options and refusals name. */
const DRIVER = "zatca";

/** What `register` reads: the portal code and the unit's CSR. */
const INPUTS = [OnboardingInput.Otp, OnboardingInput.Csr] as const;

/**
 * Onboards one unit at a time.
 *
 * @example
 * await onboarding.compliance("till_1", csr, otp, pack.till.options);
 * await onboarding.check("till_1", sampleRecord, pack.till.options);
 * await onboarding.production("till_1", pack.till.options);
 */
export class ZatcaOnboarding extends Driver(FiscalOnboarding) {
  /** The key a till mandate names. */
  readonly key = DRIVER;

  /** The portal code, then the CSR. */
  readonly inputs = INPUTS;

  /** Reaches the onboarding endpoints. */
  private readonly transport: FiscalTransport;

  /** Stores the issued credentials. */
  private readonly credentials: TillCredentials;

  /**
   * @param transport - the host's HTTP binding.
   * @param credentials - the till credential store.
   */
  constructor(transport: FiscalTransport, credentials: TillCredentials) {
    super();
    this.transport = transport;
    this.credentials = credentials;
  }

  /**
   * `compliance` with the answers' OTP and CSR.
   *
   * @throws FiscalOnboardingInputMissingError when an answer is left out.
   */
  async register(
    unitId: string,
    answers: Readonly<Partial<Record<OnboardingInput, string>>>,
    options: unknown,
  ): Promise<OnboardingStep> {
    const { otp, csr } = onboardingAnswers(answers, INPUTS, unitId, DRIVER);
    return this.compliance(unitId, csr, otp, options);
  }

  /** Completes onboarding with the `production` step. */
  async complete(unitId: string, options: unknown): Promise<OnboardingStep> {
    return this.production(unitId, options);
  }

  /**
   * Asks for the unit's compliance CSID and stores it.
   *
   * @param csr - the unit's certificate signing request, base64, from the host's signer.
   * @param otp - the one-time password the taxpayer took from the authority's portal.
   * @returns the stored credential's stage and request id, never its token or secret.
   * @throws FiscalOnboardingRefusedError when the authority refuses the request.
   * @throws FiscalAuthorityUnavailableError when the authority does not take it.
   */
  async compliance(
    unitId: string,
    csr: string,
    otp: string,
    options: unknown,
  ): Promise<OnboardingStep> {
    const parsed = parseOptions(ZATCA_OPTIONS, options, DRIVER);
    return this.issue(unitId, "compliance", {
      method: "POST",
      url: parsed.complianceCsidUrl,
      credential: null,
      headers: {
        "Accept-Version": parsed.apiVersion,
        OTP: otp,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ csr }),
    });
  }

  /**
   * Sends a sample record sealed with the compliance CSID to the authority's compliance check.
   *
   * @throws FiscalAuthorityUnavailableError when the authority does not take it.
   */
  async check(unitId: string, record: FiscalRecord, options: unknown): Promise<SubmissionOutcome> {
    const parsed = parseOptions(ZATCA_OPTIONS, options, DRIVER);
    const response = await this.transport.send(
      zatcaRequest({ ...record, unitId }, parsed.complianceInvoicesUrl, parsed.apiVersion, false),
    );
    return zatcaOutcome(assertAnswered(response, DRIVER));
  }

  /**
   * Exchanges the unit's compliance CSID for a production CSID and stores it.
   *
   * @returns the stored credential's stage and request id.
   * @throws FiscalCredentialMissingError when the unit has no compliance CSID.
   * @throws FiscalOnboardingRefusedError when the authority refuses the exchange.
   */
  async production(unitId: string, options: unknown): Promise<OnboardingStep> {
    const parsed = parseOptions(ZATCA_OPTIONS, options, DRIVER);
    const current = await this.credentials.get(unitId);
    if (current?.stage !== "compliance" || !current.requestId)
      throw FiscalCredentialMissingError.create({ unitId, driver: DRIVER });
    return this.issue(unitId, "production", {
      method: "POST",
      url: parsed.productionCsidUrl,
      credential: unitId,
      headers: { "Accept-Version": parsed.apiVersion, "Content-Type": "application/json" },
      body: JSON.stringify({ compliance_request_id: current.requestId }),
    });
  }

  /** Sends the request, stores the issued credential, and returns its public facts. */
  private async issue(
    unitId: string,
    stage: TillCredential["stage"],
    request: Parameters<FiscalTransport["send"]>[0],
  ): Promise<OnboardingStep> {
    const response = assertAnswered(await this.transport.send(request), DRIVER);
    let json: unknown = null;
    try {
      json = JSON.parse(response.body);
    } catch {
      json = null;
    }
    const answer = CSID_ANSWER.safeParse(json);
    if (response.status !== 200 || !answer.success)
      throw FiscalOnboardingRefusedError.create({ unitId, status: response.status });
    const requestId = String(answer.data.requestID);
    await this.credentials.save({
      unitId,
      stage,
      requestId,
      token: answer.data.binarySecurityToken,
      secret: answer.data.secret,
      certificate: null,
      certificateSerial: null,
    });
    return { unitId, stage, requestId };
  }
}
