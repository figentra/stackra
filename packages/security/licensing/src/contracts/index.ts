/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/licensing, the Stackra registry licence API contract
 *          (the OS billing hook of ADR 0453 decision 14), until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0453 (decision 14).
 */
export type { RegistryLicence } from "#contracts/types/registry-licence.type";
export type { RegistryLicenceCommand } from "#contracts/types/registry-licence-command.type";
export type { RegistryLicenceGrant } from "#contracts/types/registry-licence-grant.type";
export type { RegistryLicenceToken } from "#contracts/types/registry-licence-token.type";
