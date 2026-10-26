/**
 * Stackra file contract:
 * Purpose: `APP_MEMBER_REFERENCE_SCHEMA`, the `app` of a surface or mobile entry: the product's own app member that
 *          serves it (`apps/<member>`) and the four-digit ADR that allows that app.
 * Boundary: internal; the surface and mobile app schemas compose it. That the member exists, and that every app member
 *           of a product is referenced, is `checkSurfaces`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0436 (decision 3 and enforcement: an app member needs its own ADR), ADR 0442.
 */
import { z } from "zod";

/** `{ member: "till", adr: "0442" }`. */
export const APP_MEMBER_REFERENCE_SCHEMA = z.strictObject({
  member: z.string().regex(/^[a-z][a-z0-9-]*$/, "Expected a lower-case member key"),
  adr: z.string().regex(/^[0-9]{4}$/, "Expected a four-digit ADR number, such as 0442"),
});
