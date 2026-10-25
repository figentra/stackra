/**
 * Stackra file contract:
 * Purpose: `DeviceStatus`, where a registered device stands in the registry: in service, or retired (its credential
 *          revoked by identity, its record kept for the audit trail and its last acknowledged sequence).
 * Boundary: an `Enum.of` value plus the type of the same name; the codes are the registry's stored values.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7: the registry in @stackra/devices); ADR 0235 (decision 1, as amended);
 *                     ADR 0294 (decision 16); ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** A registered device's standing. */
export const DeviceStatus = Enum.of({
  /** Paired and in service. */
  Active: "active",
  /** Taken out of service; it can no longer call the hub. */
  Retired: "retired",
});

/** One of the codes above. */
export type DeviceStatus = Enum.Value<typeof DeviceStatus>;
