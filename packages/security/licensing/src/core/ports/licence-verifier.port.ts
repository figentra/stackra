/**
 * Stackra file contract:
 * Purpose: the `LicenceVerifier` port: how an install proves its licence. `verify` reads and checks a licence file
 *          offline; `check` asks the licence server about a key, only when the install opted in to an online check.
 * Boundary: an abstract class that is its own token, keyed `licensing.LicenceVerifier`, kept in `.` beside the `Licence`
 *           and `LicenceKeyCheck` types its signature names (as `EntitlementSource` sits beside its types). The account,
 *           the verify key and the API origin are the driver's configuration, never a caller's argument; the licence
 *           key is passed per call and never stored. `KeygenLicenceVerifierDriver` implements it.
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decisions 1, 2, 5 and 6); owner round 3 #37 (a port for licensing); ADR 0263.
 */
import { Port } from "@stackra/contracts";

import type { Licence } from "#core/types/licence.type";
import type { LicenceKeyCheck } from "#core/types/licence-key-check.type";

/**
 * Verifies an install's licence, offline from its file or online when the install opted in.
 *
 * @example
 * const licence = await verifier.verify(await readFile("/etc/stackra/licence.lic", "utf8"));
 * licenceStanding(licence, Duration.days(graceDays), clock.now());
 */
export abstract class LicenceVerifier extends Port {
  /** Type-only port key, so `DriverName<LicenceVerifier>` narrows to this port's drivers. */
  declare readonly "~key": "licensing.LicenceVerifier";

  /**
   * The licence a signed file states; `licenceKey` decrypts an encrypted file.
   *
   * @throws LicenceFileInvalidError when the file cannot be trusted.
   */
  abstract verify(file: string, licenceKey?: string): Promise<Licence>;

  /**
   * The licence server's verdict on `licenceKey`, scoped to `fingerprint` when given.
   *
   * @throws LicenceCheckUnavailableError when the server gives no verdict; keep the offline standing.
   */
  abstract check(licenceKey: string, fingerprint?: string): Promise<LicenceKeyCheck>;
}
