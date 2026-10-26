/**
 * Stackra file contract:
 * Purpose: `OnboardingInput`, what an operator types or a till hands over when a unit registers with a fiscal
 *          authority: a one-time portal code, a signing request, portal-issued client credentials, the device facts.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. Each `FiscalOnboarding` lists the
 *           inputs it needs, so the pairing screen asks for exactly those; labels are the host's lang keys. Codes are
 *           snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * Keys of the answers `FiscalOnboarding#register` reads.
 *
 * @example
 * await onboarding.register("till_1", { [OnboardingInput.Otp]: "123456", [OnboardingInput.Csr]: csr }, options);
 */
export const OnboardingInput = Enum.of({
  /** The one-time password the taxpayer took from the authority's portal. */
  Otp: "otp",
  /** The unit's certificate signing request, base64, made by the host's signer. */
  Csr: "csr",
  /** The client id the portal issued for this unit. */
  ClientId: "client_id",
  /** The client secret the portal issued for this unit. */
  ClientSecret: "client_secret",
  /** The pre-shared key the portal issued for this unit. */
  PresharedKey: "preshared_key",
  /** The serial number the unit was registered under on the portal. */
  DeviceSerial: "device_serial",
  /** The unit's operating system version as registered on the portal. */
  DeviceOsVersion: "device_os_version",
});

/** One of the codes above. */
export type OnboardingInput = Enum.Value<typeof OnboardingInput>;
