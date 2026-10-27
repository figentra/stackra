/**
 * Stackra file contract:
 * Purpose: `DeviceOnboardingDriver`, unit registration for till mandates whose authority identity lives in a fiscal
 *          device (a TSE, a fiscal data module, a telematic recorder): `register` has the device register the till as
 *          its client and report its serial and certificate, `complete` has it activate that registration.
 * Boundary: a `FiscalOnboarding` driver over `FiscalDevice` and `TillCredentials`, one per device mandate: a subclass
 *           declares that mandate's `key` (`tse`, `fdm`, `rt`), or `DeviceOnboardingDriver.for` does; the constructor
 *           takes class tokens only (ADR 0294 rule 17). Commands are `<key>.register` and `<key>.activate`; the host's
 *           device binding speaks the device's own protocol and any authority portal behind it. Answers are checked
 *           by `parseDeviceAnswer`. The operator types nothing, so `inputs` is empty.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 4 and 5).
 */
import { Driver } from "@stackra/container";
import { z } from "zod";

import type { OnboardingInput } from "#contracts/enums/onboarding-input.enum";
import type { FiscalDevice } from "#contracts/ports/fiscal-device.port";
import { FiscalOnboarding } from "#contracts/ports/fiscal-onboarding.port";
import type { TillCredentials } from "#contracts/ports/till-credentials.port";
import type { OnboardingStep } from "#contracts/types/onboarding-step.type";
import { FiscalCredentialMissingError } from "#core/errors/fiscal-credential-missing.error";
import { FiscalOnboardingRefusedError } from "#core/errors/fiscal-onboarding-refused.error";
import { parseDeviceAnswer } from "#core/functions/parse-device-answer.function";

/** The device's answer to both commands. */
const ANSWER = z.object({
  /** Whether the device (or the authority behind it) took the registration. */
  registered: z.boolean(),
  /** The device's serial as the mandate prints it. */
  serial: z.string().min(1),
  /** The device's certificate, base64 DER, when it has one. */
  certificate: z.string().min(1).nullish(),
});

/**
 * Registers a till with its paired fiscal device.
 *
 * @example
 * const onboardings = FiscalOnboardingService.with([DeviceOnboardingDriver.for("tse", device, credentials)]);
 */
export abstract class DeviceOnboardingDriver extends Driver(FiscalOnboarding) {
  // `key`, the port's abstract member, is the device mandate's driver key: a subclass (or `for`) declares it.

  /** Nothing to type: the device knows its own identity. */
  readonly inputs: readonly OnboardingInput[] = [];

  /** The till's paired device. */
  private readonly device: FiscalDevice;

  /** Stores the device's serial and certificate. */
  private readonly credentials: TillCredentials;

  /**
   * @param device - the paired device binding.
   * @param credentials - the till credential store.
   */
  constructor(device: FiscalDevice, credentials: TillCredentials) {
    super();
    this.device = device;
    this.credentials = credentials;
  }

  /**
   * The onboarding of the device mandate `key`, for a host that builds it by hand.
   * @param key - the device mandate's driver key, the same its `FiscalDriver` has.
   * @param device - the paired device binding.
   * @param credentials - the till credential store.
   */
  static for(
    key: string,
    device: FiscalDevice,
    credentials: TillCredentials,
  ): DeviceOnboardingDriver {
    return new (class extends DeviceOnboardingDriver {
      override readonly key = key;
    })(device, credentials);
  }

  /**
   * Has the device register the till; stores its serial and certificate at stage `compliance`.
   *
   * @throws FiscalOnboardingRefusedError when the device answers `registered: false`; nothing is stored.
   * @throws FiscalAuthorityUnavailableError when the device answers in another shape.
   */
  async register(unitId: string): Promise<OnboardingStep> {
    return this.step(unitId, "register", "compliance");
  }

  /**
   * Has the device activate the registration and marks the credential `production`.
   *
   * @throws FiscalCredentialMissingError when the unit has no compliance credential.
   * @throws FiscalOnboardingRefusedError when the device answers `registered: false`.
   */
  async complete(unitId: string): Promise<OnboardingStep> {
    const current = await this.credentials.get(unitId);
    if (current?.stage !== "compliance" || !current.certificateSerial)
      throw FiscalCredentialMissingError.create({ unitId, driver: this.key });
    return this.step(unitId, "activate", "production");
  }

  /** Sends one command, stores the answer at a stage, and returns its public facts. */
  private async step(
    unitId: string,
    command: "register" | "activate",
    stage: OnboardingStep["stage"],
  ): Promise<OnboardingStep> {
    const answer = parseDeviceAnswer(
      ANSWER,
      await this.device.call(unitId, `${this.key}.${command}`, { unitId }),
      this.key,
    );
    // status 0: the refusal came from the device, not an HTTP authority
    if (!answer.registered) throw FiscalOnboardingRefusedError.create({ unitId, status: 0 });
    await this.credentials.save({
      unitId,
      stage,
      requestId: null,
      token: null,
      secret: null,
      certificate: answer.certificate ?? null,
      certificateSerial: answer.serial,
    });
    return { unitId, stage, requestId: null };
  }
}
