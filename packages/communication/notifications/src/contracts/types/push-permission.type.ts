/**
 * Stackra file contract:
 * Purpose: `PushPermission`, where this device's push permission stands after the push primer: granted, denied, or
 *          still to be asked (`prompt`, also when the person chose "not now").
 * Boundary: a type only; what `PushRegistration.register` answers and `PushPrimer` reports. The spelling follows
 *           `@stackra/platform`'s permission status, so an app's binding passes it through.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (client ports); ADR 0223 (decision 1); ADR 0255 (decision 3).
 */

/** The push permission of this device. */
export type PushPermission = "granted" | "denied" | "prompt";
