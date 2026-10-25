/**
 * Stackra file contract:
 * Purpose: `FulfilmentRequest`, an order handed to a fulfilment provider to pick, pack and ship.
 * Boundary: a type only. The recipient's contact travels for this delivery only.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 1); COM-147; ADR 0134 (personal data).
 */
import type { Address } from "@stackra/validation";

/** An order to fulfil. */
export interface FulfilmentRequest {
  /** Our order's reference, kept by the provider. */
  readonly reference: string;

  /** What to ship. */
  readonly lines: readonly { readonly sku: string; readonly quantity: number }[];

  /** Where to. */
  readonly shipTo: Address;

  /** The recipient's name. */
  readonly recipientName: string;

  /** The recipient's phone in E.164, for the courier. */
  readonly recipientPhone: `+${string}`;

  /** The provider's service level code, from the tenant's settings. */
  readonly serviceLevel?: string;
}
