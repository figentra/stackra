/**
 * Stackra file contract:
 * Purpose: `CustomerPersonalData`, the test declaration whose name is shredded and phone anonymised; the row stays.
 * Boundary: test only; a plain stand-in, no database. Each test registers the declarations it needs and clears them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-1375.
 */
import { ErasureMethod } from "#contracts/enums/erasure-method.enum";
import { PersonalData } from "#core/bases/personal-data.base";
import { Customer } from "#core/__tests__/customer.fixture";

/** The customer's name is shredded, the phone anonymised. */
export class CustomerPersonalData extends PersonalData({
  model: () => Customer,
  subject: "userId",
  fields: { name: ErasureMethod.Shred, phone: ErasureMethod.Anonymise },
}) {}
