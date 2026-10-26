/**
 * Stackra file contract:
 * Purpose: `EtaOnboardingDriver`, POS registration for the `eta` till mandate (the Egyptian e-receipt system): the
 *          client id, client secret and pre-shared key the taxpayer's portal issued for one POS, checked by asking the
 *          identity service for an access token with the POS's serial and OS version, then kept per unit.
 * Boundary: the `eta` driver of `FiscalOnboarding` over `FiscalTransport` and `TillCredentials`. The client id goes in
 *           `token`, the secret in `secret`, the serial, OS version and pre-shared key in `attributes`; the access
 *           token is only proof and is dropped, so the host's transport binding mints its own per call. The token
 *           endpoint is the mandate's pack option (`ETA_ONBOARDING_OPTIONS`); header and grant names are the
 *           protocol's.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 4 and 5); ADR 0173 (secrets stay with the host).
 */
import { Driver } from "@stackra/container";
import { z } from "zod";

import { OnboardingInput } from "#contracts/enums/onboarding-input.enum";
import { FiscalOnboarding } from "#contracts/ports/fiscal-onboarding.port";
import type { FiscalTransport } from "#contracts/ports/fiscal-transport.port";
import type { TillCredentials } from "#contracts/ports/till-credentials.port";
import type { OnboardingStep } from "#contracts/types/onboarding-step.type";
import type { TillCredential } from "#contracts/types/till-credential.type";
import { ETA_ONBOARDING_OPTIONS } from "#core/constants/eta-onboarding-options.constant";
import { FiscalAuthorityUnavailableError } from "#core/errors/fiscal-authority-unavailable.error";
import { FiscalCredentialMissingError } from "#core/errors/fiscal-credential-missing.error";
import { FiscalOnboardingRefusedError } from "#core/errors/fiscal-onboarding-refused.error";
import { onboardingAnswers } from "#core/functions/onboarding-answers.function";
import { parseOptions } from "#core/functions/parse-options.function";

/** The driver key the options and refusals name. */
const DRIVER = "eta";

/** What `register` reads, in the order the portal shows them. */
const INPUTS = [
  OnboardingInput.ClientId,
  OnboardingInput.ClientSecret,
  OnboardingInput.PresharedKey,
  OnboardingInput.DeviceSerial,
  OnboardingInput.DeviceOsVersion,
] as const;

/** The answers this driver keeps in `attributes`. */
const ATTRIBUTES = [
  OnboardingInput.PresharedKey,
  OnboardingInput.DeviceSerial,
  OnboardingInput.DeviceOsVersion,
] as const;

/** Statuses that say nothing about the credentials, so the step may be retried as is. */
const NOT_TAKEN = new Set([408, 429]);

/** The identity service's answer to a good client. */
const TOKEN_ANSWER = z.object({ access_token: z.string().min(1) });

/** One POS's registration values. */
type Registration = Record<(typeof INPUTS)[number], string>;

/**
 * Registers one POS at a time.
 *
 * @example
 * const onboarding = new EtaOnboardingDriver(transport, credentials);
 * await onboarding.register("till_1", { client_id, client_secret, preshared_key, device_serial, device_os_version }, pack.till.options);
 * await onboarding.complete("till_1", pack.till.options);
 */
export class EtaOnboardingDriver extends Driver(FiscalOnboarding) {
  /** The key a till mandate names. */
  readonly key = DRIVER;

  /** The portal's client id, secret and pre-shared key, then the POS's serial and OS version. */
  readonly inputs = INPUTS;

  /** Reaches the identity service. */
  private readonly transport: FiscalTransport;

  /** Stores the POS's credentials. */
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
   * Proves the portal's values with a token request, then stores them at stage `compliance`.
   *
   * @throws FiscalOnboardingInputMissingError when an answer is left out.
   * @throws FiscalOnboardingRefusedError when the identity service refuses them; nothing is stored.
   * @throws FiscalAuthorityUnavailableError when it does not answer.
   */
  async register(
    unitId: string,
    answers: Readonly<Partial<Record<OnboardingInput, string>>>,
    options: unknown,
  ): Promise<OnboardingStep> {
    const { tokenUrl } = parseOptions(ETA_ONBOARDING_OPTIONS, options, DRIVER);
    const registration = onboardingAnswers(answers, INPUTS, unitId, DRIVER);
    await this.prove(unitId, tokenUrl, registration);
    return this.store(unitId, "compliance", registration);
  }

  /**
   * Proves the stored values again and marks them `production`.
   *
   * @throws FiscalCredentialMissingError when the unit has no complete compliance credential.
   * @throws FiscalOnboardingRefusedError when the identity service no longer takes them.
   */
  async complete(unitId: string, options: unknown): Promise<OnboardingStep> {
    const { tokenUrl } = parseOptions(ETA_ONBOARDING_OPTIONS, options, DRIVER);
    const registration = registrationOf(await this.credentials.get(unitId));
    if (!registration) throw FiscalCredentialMissingError.create({ unitId, driver: DRIVER });
    await this.prove(unitId, tokenUrl, registration);
    return this.store(unitId, "production", registration);
  }

  /** Asks for an access token with the POS's values; returns only when one is issued. */
  private async prove(unitId: string, tokenUrl: string, registration: Registration): Promise<void> {
    const response = await this.transport.send({
      method: "POST",
      url: tokenUrl,
      credential: null,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        posserial: registration.device_serial,
        pososversion: registration.device_os_version,
        presharedkey: registration.preshared_key,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: registration.client_id,
        client_secret: registration.client_secret,
      }).toString(),
    });
    if (response.status >= 500 || NOT_TAKEN.has(response.status))
      throw FiscalAuthorityUnavailableError.create({ driver: DRIVER, status: response.status });
    let json: unknown = null;
    try {
      json = JSON.parse(response.body);
    } catch {
      json = null;
    }
    if (response.status !== 200 || !TOKEN_ANSWER.safeParse(json).success)
      throw FiscalOnboardingRefusedError.create({ unitId, status: response.status });
  }

  /** Saves the values at a stage and returns its public facts. */
  private async store(
    unitId: string,
    stage: TillCredential["stage"],
    registration: Registration,
  ): Promise<OnboardingStep> {
    await this.credentials.save({
      unitId,
      stage,
      requestId: null,
      token: registration.client_id,
      secret: registration.client_secret,
      certificate: null,
      certificateSerial: null,
      attributes: Object.fromEntries(ATTRIBUTES.map((key) => [key, registration[key]])),
    });
    return { unitId, stage, requestId: null };
  }
}

/** The stored compliance values; `null` when the unit has none or some are missing. */
function registrationOf(credential: TillCredential | null): Registration | null {
  if (credential?.stage !== "compliance" || !credential.token || !credential.secret) return null;
  const registration: Partial<Registration> = {
    client_id: credential.token,
    client_secret: credential.secret,
  };
  for (const key of ATTRIBUTES) {
    const value = credential.attributes?.[key];
    if (!value) return null;
    registration[key] = value;
  }
  return registration as Registration;
}
