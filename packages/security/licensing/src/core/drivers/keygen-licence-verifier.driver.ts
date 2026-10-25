/**
 * Stackra file contract:
 * Purpose: `KeygenLicenceVerifierDriver`, the `LicenceVerifier` over Keygen: `verifyLicenceFile` with the configured
 *          verify key, and `checkLicenceKey` against the configured account and API origin.
 * Boundary: reads `LicensingConfig` only; the origin is configuration (a self-hosted Keygen sets `apiUrl`). An unset
 *           account or verify key is a configuration bug, refused with a `RangeError` before any call. The online check
 *           goes through the transport it is given (the global fetch when none).
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decisions 1, 2 and 5); ADR 0260 (calls go through the transport); owner round 3 #37.
 */
import { Driver } from "@stackra/container";
import type { Transport } from "@stackra/transport";

import { LicensingConfig } from "#config/licensing.config";
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

  /** The transport of the online check; the global fetch when absent. */
  private readonly transport: Transport | undefined;

  /**
   * @param config - the licensing configuration.
   * @param transport - what the online check sends through; the global fetch when left out.
   */
  constructor(config: LicensingConfig, transport?: Transport) {
    super();
    this.config = config;
    this.transport = transport;
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
      ...(this.transport === undefined ? {} : { transport: this.transport }),
    });
  }
}
