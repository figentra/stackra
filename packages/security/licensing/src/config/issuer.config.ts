/**
 * Stackra file contract:
 * Purpose: `IssuerConfig`, the configuration of the licence issuer (key `licensing.issuer`): the `LicenceIssuer` driver
 *          and the Keygen product token, read by `KeygenLicenceIssuerDriver`.
 * Boundary: the class is the DI token, over `IssuerOptions`; the key leaves `licensing` itself to `LicensingConfig`.
 *           Set only where licences are issued (OS licensing); an install never has a product token. Never per scope.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146; ADR 0173; ADR 0178 (decision 2).
 */
import { Config } from "@stackra/config";

import { IssuerOptions } from "#core/schemas/issuer-options.schema";

/**
 * The licence issuer configuration.
 *
 * @example
 * import { IssuerConfig as BaseIssuerConfig } from "@stackra/licensing";
 *
 * export class IssuerConfig extends BaseIssuerConfig {
 *   override driver: DriverName<LicenceIssuer> = "memory";
 * }
 */
export class IssuerConfig extends Config({ schema: IssuerOptions }) {}
