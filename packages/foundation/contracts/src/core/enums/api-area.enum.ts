/**
 * Stackra file contract:
 * Purpose: the four API areas: the audience of an endpoint, a member's `area` in `stackra.config.ts`, and the area of
 *          a panel or a settings page.
 * Boundary: an `Enum.of` value plus the type of the same name. Every endpoint belongs to exactly one area, and each
 *           area has its own gate chain; the generated gateway routes by it.
 * Runtime: isomorphic
 * Governing contract: ADR 0082 (decision 3, as accepted by 0135), ADR 0237 (the gateway routes by area), ADR 0231
 *                     (snake_case codes).
 */
import { Enum } from "#core/bases/enum.base";

/** One case per audience; `Public` is the only area where `auth: false` is expected. */
export const ApiArea = Enum.of({
  /** Callers without a session. */
  Public: "public",
  /** A tenant's end users. */
  App: "app",
  /** A tenant's administrators. */
  Admin: "admin",
  /** Platform operators; every call is audited. */
  Platform: "platform",
});

/** One of the codes above. */
export type ApiArea = Enum.Value<typeof ApiArea>;
