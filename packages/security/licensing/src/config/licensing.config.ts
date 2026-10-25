/**
 * Stackra file contract:
 * Purpose: `LicensingConfig`, the configuration of @stackra/licensing (key `licensing`): where the licence API lives,
 *          which account issued the licences and the account's public verify key, read by `KeygenLicenceVerifierDriver`.
 * Boundary: the class is the DI token. Every value is public: the verify key verifies and never signs, and the licence
 *           key is the customer's and never lives here. A host overrides it under the same name, with this class aliased
 *           `BaseLicensingConfig`, by `override` members only; an environment (a self-hosted licence server) sets
 *           `apiUrl` instead of code naming one.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0178 (decisions 1, 2 and 5); owner round 3 #37.
 */
import { Config } from "@stackra/config";

import { LicensingOptions } from "#core/schemas/licensing-options.schema";

/**
 * The licence account and API.
 *
 * @example
 * import { LicensingConfig as BaseLicensingConfig } from "@stackra/licensing";
 *
 * export class LicensingConfig extends BaseLicensingConfig {
 *   override account = "figentra";
 *   override publicKey = "e8601e48b69383ba520245fd07971e983d06d22c4257cfd82304601479cee788";
 * }
 */
export class LicensingConfig extends Config({ schema: LicensingOptions }) {}
