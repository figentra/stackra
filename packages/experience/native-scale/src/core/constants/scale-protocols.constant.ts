/**
 * Stackra file contract:
 * Purpose: `SCALE_PROTOCOLS`, the shipped scale protocol pack, the default of `NativeScaleConfig.protocols`: the first
 *          two protocols this package drives, chosen because together they cover most retail and precision scales a
 *          Commerce, Mezzora or Jute counter meets over Bluetooth or USB serial:
 *          - `mt_sics`: Mettler Toledo's Standard Interface Command Set (levels 0 and 1), a documented request and
 *            answer protocol that reports stability, unit, net weight, overload and underload, and the tare (`TA`);
 *          - `continuous_ascii`: the continuous ASCII stream of A&D's standard format (`ST,+00123.45  g`), which many
 *            indicator makers copy, with the stable, unstable and overload headers and the gross or net field.
 * Boundary: data only (configuration, not code, ADR 0253 decision 4); a host overrides an entry's terminator or
 *           commands in its `NativeScaleConfig`. The maker lists are from the vendors' public interface manuals,
 *           not from certified models: certification records the models (STA-739). A third protocol (Toledo 8217
 *           scanner-scales, CAS, DIGI) is a driver, a `ScaleProtocolName` and an entry here.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 5 and 8); ADR 0253 (decision 4).
 */
import type { ScaleProtocol } from "#core/types/scale-protocol.type";
import type { ScaleProtocolName } from "#core/types/scale-protocol-name.type";

/** The shipped protocol pack. */
export const SCALE_PROTOCOLS: Readonly<Record<ScaleProtocolName, ScaleProtocol>> = Object.freeze({
  mt_sics: Object.freeze({
    makers: Object.freeze([
      "Mettler Toledo balances and weighing terminals with MT-SICS (IND, ICS, XS, MS, ML series)",
    ]),
    transports: Object.freeze(["ble", "spp", "usb"] as const),
    terminator: "\r\n",
    request: "SI",
    streamStart: "SIR",
    streamStop: "@",
    tareQuery: "TA",
  }),
  continuous_ascii: Object.freeze({
    makers: Object.freeze([
      "A&D balances and indicators in the A&D standard format (EK-i, EW-i, GF, GX, FX-i, AD-4212)",
      "Indicators with an A&D-compatible ST/US/OL output",
    ]),
    transports: Object.freeze(["ble", "spp", "usb"] as const),
    terminator: "\r\n",
    request: "",
    streamStart: "",
    streamStop: "",
    tareQuery: "",
  }),
});
