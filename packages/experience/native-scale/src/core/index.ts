/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/native-scale: the `Scale` drivers of the `StackraNativeScale`
 *          Expo module, one per protocol (`MtSicsScaleDriver`, `ContinuousAsciiScaleDriver`), the configuration
 *          with its shape and shipped schema, the protocol pack and the types a caller names, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Loadable anywhere: no module here imports a native package;
 *           each driver reads the module from the Expo modules registry when it runs. The parsers, the module type
 *           and the link functions stay internal. The port is `@stackra/peripherals/contracts`' `Scale`, unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0478 (decisions 2, 5 and 6); the STA-347 stand-in barrel decision.
 */
export { NativeScaleConfig } from "#config/native-scale.config";
export { NATIVE_SCALE_CONFIG_SCHEMA } from "#core/constants/native-scale-config-schema.constant";
export { SCALE_PROTOCOLS } from "#core/constants/scale-protocols.constant";
export { ContinuousAsciiScaleDriver } from "#core/drivers/continuous-ascii-scale.driver";
export { MtSicsScaleDriver } from "#core/drivers/mt-sics-scale.driver";
export { ScaleProtocolName } from "#core/enums/scale-protocol-name.enum";
export { NativeScaleOptions } from "#core/schemas/native-scale-options.schema";
export type { ScaleFrame } from "#core/types/scale-frame.type";
export type { ScaleProtocol } from "#core/types/scale-protocol.type";
export type { ScaleTransport } from "#core/types/scale-transport.type";
