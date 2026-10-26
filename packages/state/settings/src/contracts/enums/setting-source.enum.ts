/**
 * Stackra file contract:
 * Purpose: `SettingSource`, the provenance of a resolved setting: the key's default, a holder's stored value, a
 *          legal floor that lifted the value, or the default because the plan does not include the stored value.
 * Boundary: an `Enum.of` value plus the type of the same name. The admin turns it into words ("default from
 *           Figentra", "set by your company", "required by law in KSA") from the holder and the floor it comes with.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 2: provenance); ADR 0359 (decision 1); config-model section 3; ADR 0420
 *                     (decision 3).
 */
import { Enum } from "@stackra/contracts";

/** Where a resolved value comes from. */
export const SettingSource = Enum.of({
  /** No holder stores it: the key's default. */
  Default: "default",
  /** A holder of the cascade stores it. */
  Layer: "layer",
  /** A legal floor of the market pack lifted it. */
  Floor: "floor",
  /** The holder's plan does not include the stored value, so the key's default applies. */
  Entitlement: "entitlement",
});

/** One of the codes above. */
export type SettingSource = Enum.Value<typeof SettingSource>;
