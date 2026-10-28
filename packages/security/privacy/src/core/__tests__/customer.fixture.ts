/**
 * Stackra file contract:
 * Purpose: `Customer`, the stand-in customer model of this package's tests: its name is sealed under the key of the
 *          subject `userId` names, so `CustomerPersonalData` may shred it.
 * Boundary: test only; no database. Each test registers the declarations it needs and clears them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-1375; gap gov2 (stackra-263).
 */
import { HasEncryptedFields, Model } from "@stackra/model";

/** A stand-in customer model. */
export class Customer extends Model.with(HasEncryptedFields({ subject: "userId" }, "name")) {
  id!: string;

  userId!: string;

  name!: string | null;

  phone!: string | null;
}
