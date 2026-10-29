/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/native-customer-display: the `external` driver behind
 *          @stackra/peripherals' `CustomerDisplay` port (ADR 0478 decision 5), until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Loadable anywhere: no module here imports a native package; the
 *           driver reads the `StackraCustomerDisplay` module from the modules registry when it runs. The module type
 *           and the registry lookup stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0478 (decisions 2 and 5); the STA-347 stand-in barrel decision.
 */
export { ExternalCustomerDisplayDriver } from "#core/drivers/external-customer-display.driver";
