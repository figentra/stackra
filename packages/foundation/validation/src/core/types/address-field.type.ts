/**
 * Stackra file contract:
 * Purpose: `AddressField`, the name of one optional part of an `Address` an `AddressFormat` may require or print.
 * Boundary: a type only, derived from `Address`.
 * Runtime: isomorphic
 * Governing contract: OS-370; ADR 0305.
 */
import type { Address } from "#core/types/address.type";

/** `district`, `locality`, `region`, `postalCode` or `shortCode`. */
export type AddressField = Exclude<keyof Address, "lines" | "country">;
