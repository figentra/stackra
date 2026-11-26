/**
 * Stackra file contract:
 * Purpose: `fieldErrorOf(binding)`, the error text of an invalid form binding, or undefined.
 * Boundary: internal: pure; a list or map field shows it as its section's description.
 * Runtime: isomorphic
 * Governing contract: ADR 0055 (thin field adapters).
 */
import type { FormFieldBinding } from "@stackra/ui/contracts";

/**
 * The error text of `binding`.
 *
 * @example
 * fieldErrorOf(list); // "Add at least one parcel"
 */
export function fieldErrorOf(
  binding: Pick<FormFieldBinding<unknown>, "isInvalid" | "errorMessage">,
): string | undefined {
  return binding.isInvalid === true && typeof binding.errorMessage === "string"
    ? binding.errorMessage
    : undefined;
}
