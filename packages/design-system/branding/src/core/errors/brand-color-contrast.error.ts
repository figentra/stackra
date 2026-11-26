/**
 * Stackra file contract:
 * Purpose: `BrandColorContrastError`, the refusal of a brand colour that is too low in contrast to read
 *          (`brand_color_contrast`): its measured ratio and the minimum its rule asks for.
 * Boundary: kind `Validation` (HTTP 400), not retryable. Built by `brandColorRefusals`, with the refused setting's
 *           path as its field error. The ratio is floored to two decimals, so a refused 4.499 never reads as 4.5.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0305 (rules 2 and 3); STA-2644.
 */
import { ErrorKind, Refusal } from "@stackra/errors";
import { Num } from "@stackra/validation";

/**
 * Not retryable: the same colour is refused again.
 *
 * @example
 * throw BrandColorContrastError.create({ ratio: 2.32, minimum: 3 }, { fieldErrors: { accentColor: "brand_color_contrast" } });
 */
export class BrandColorContrastError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The colour's contrast ratio, floored to two decimals (`2.32` means 2.32:1). */
  @Num({
    min: 1,
    max: 21,
  })
  ratio!: number;

  /** The ratio its rule needs (`4.5` or `3`). */
  @Num({
    min: 1,
    max: 21,
  })
  minimum!: number;
}
