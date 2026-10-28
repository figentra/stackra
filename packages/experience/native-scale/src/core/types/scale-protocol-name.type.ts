/**
 * Stackra file contract:
 * Purpose: `ScaleProtocolName`, the scale protocols this package ships a driver for, each a key of
 *          `NativeScaleConfig.protocols` and the driver name gen selects by `config:nativeScale.protocol`:
 *          `mt_sics` (`MtSicsScaleDriver`) and `continuous_ascii` (`ContinuousAsciiScaleDriver`).
 * Boundary: a type only. A new protocol is a new driver file, a name here and its `SCALE_PROTOCOLS` entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5: one driver per protocol); ADR 0294 (decision 19).
 */

/** A protocol with a driver in this package. */
export type ScaleProtocolName = "mt_sics" | "continuous_ascii";
