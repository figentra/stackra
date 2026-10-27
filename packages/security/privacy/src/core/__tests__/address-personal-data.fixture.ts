/**
 * Stackra file contract:
 * Purpose: `AddressPersonalData`, the test declaration whose rows are deleted.
 * Boundary: test only; a plain stand-in, no database. Each test registers the declarations it needs and clears them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-1375.
 */
import { ErasureMethod } from "#contracts/enums/erasure-method.enum";
import { PersonalData } from "#core/bases/personal-data.base";
import { Address } from "#core/__tests__/address.fixture";

/** Address rows are deleted. */
export class AddressPersonalData extends PersonalData({
  model: () => Address,
  subject: "userId",
  fields: { line: ErasureMethod.Delete },
}) {}
