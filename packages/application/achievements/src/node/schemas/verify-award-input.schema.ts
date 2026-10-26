/**
 * Stackra file contract:
 * Purpose: `VerifyAwardInput`, the input of `achievements.award.verify@1`: the verify token from the QR code's URL, or
 *          the short code a person typed off the certificate; exactly one.
 * Boundary: a shape class in its own file. Both are query parameters of the public `GET`; the shape bounds their length
 *           so a stranger cannot send a large value. It registers its schema when the module loads (STA-339 replaces
 *           the registration).
 * Runtime: node
 * Governing contract: ADR 0432 (decisions 1 and 2); ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per
 *                     file).
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * What to verify.
 *
 * @example
 * VerifyAwardInput.create({ code: "7K3Q-9XPM-0ABZ" });
 */
export class VerifyAwardInput extends Schema {
  /** The verify token from the QR code's URL. */
  token?: string;

  /** The short code printed beside the QR code, as typed. */
  code?: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    VerifyAwardInput,
    z
      .object({ token: z.string().max(64).optional(), code: z.string().max(32).optional() })
      .refine((input) => (input.token === undefined) !== (input.code === undefined), {
        message: "Pass the token or the code, not both",
      }),
  ],
]);
