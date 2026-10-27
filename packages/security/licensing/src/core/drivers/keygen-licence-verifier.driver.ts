/**
 * Stackra file contract:
 * Purpose: `KeygenLicenceVerifierDriver`, the `LicenceVerifier` over Keygen: `verifyLicenceFile` with the configured
 *          verify key, and `checkLicenceKey` against the configured account and API origin.
 * Boundary: reads `LicensingConfig` only; the origin is configuration (a self-hosted Keygen sets `apiUrl`). An unset
 *           account or verify key is a configuration bug, refused with a `RangeError` before any call. The online check
 *           goes through `checkLicenceKey`'s default transport (the global fetch).
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decisions 1, 2 and 5); ADR 0260 (calls go through the transport); owner round 3 #37.
 */
import { Driver } from "@stackra/container";

import type { LicensingConfig } from "#config/licensing.config";
import { checkLicenceKey } from "#core/functions/check-licence-key.function";
import { verifyLicenceFile } from "#core/functions/verify-licence-file.function";
import { LicenceVerifier } from "#core/ports/licence-verifier.port";
import type { Licence } from "#core/types/licence.type";
import type { LicenceKeyCheck } from "#core/types/licence-key-check.type";

/**
 * Verifies Keygen licences.
 *
 * @example
 * const verifier = new KeygenLicenceVerifierDriver(buildConfig(LicensingConfig));
 * const licence = await verifier.verify(file);
 */
export class KeygenLicenceVerifierDriver extends Driver(LicenceVerifier) {
  /** The account, the verify key and the API origin. */
  private readonly config: LicensingConfig;

  /**
   * @param config - the licensing configuration.
   */
  constructor(config: LicensingConfig) {
    super();
    this.config = config;
  }

  /**
   * The licence `file` states.
   *
   * @throws RangeError when no verify key is configured.
   * @throws LicenceFileInvalidError when the file cannot be trusted.
   */
  verify(file: string, licenceKey?: string): Promise<Licence> {
    if (this.config.publicKey === "")
      return Promise.reject(new RangeError("LicensingConfig.publicKey is not set"));
    return verifyLicenceFile(file, {
      publicKey: this.config.publicKey,
      ...(licenceKey === undefined ? {} : { licenceKey }),
    });
  }

  /**
   * Keygen's verdict on `licenceKey`.
   *
   * @throws RangeError when no account is configured.
   * @throws LicenceCheckUnavailableError when Keygen gives no verdict.
   */
  check(licenceKey: string, fingerprint?: string): Promise<LicenceKeyCheck> {
    if (this.config.account === "")
      return Promise.reject(new RangeError("LicensingConfig.account is not set"));
    return checkLicenceKey({
      account: this.config.account,
      licenceKey,
      baseUrl: this.config.apiUrl,
      ...(fingerprint === undefined ? {} : { fingerprint }),
    });
  }
}
