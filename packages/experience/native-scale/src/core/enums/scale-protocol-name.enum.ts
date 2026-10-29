/**
 * Stackra file contract:
 * Purpose: `ScaleProtocolName`, the scale protocols this package ships a driver for, each a key of
 *          `NativeScaleConfig.protocols` and the driver name gen selects by `config:native_scale.protocol`:
 *          `mt_sics` (`MtSicsScaleDriver`) and `continuous_ascii` (`ContinuousAsciiScaleDriver`).
 * Boundary: an `Enum.of`, so gen reads the protocol field as an enum shape type. A new protocol is a new driver file, a
 *           case here and its `SCALE_PROTOCOLS` entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5: one driver per protocol); ADR 0294 (decision 19).
 */
import { Enum } from "@stackra/contracts";

/** The protocols with a driver in this package. */
export const ScaleProtocolName = Enum.of({
  /** Mettler Toledo's Standard Interface Command Set (`MtSicsScaleDriver`). */
  MtSics: "mt_sics",
  /** The A&D standard continuous ASCII stream (`ContinuousAsciiScaleDriver`). */
  ContinuousAscii: "continuous_ascii",
});

/** One of the protocols above. */
export type ScaleProtocolName = Enum.Value<typeof ScaleProtocolName>;
