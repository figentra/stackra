/**
 * Stackra file contract:
 * Purpose: `TurnoverCipher`, the port that encrypts a till's running turnover counter with the till's own key, for
 *          formats that print the counter encrypted on every receipt.
 * Boundary: an abstract class that is its own token, key `fiscal.TurnoverCipher`. The key stays with the host; the
 *           mandate's cipher mode and IV derivation are the binding's. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4).
 */
import { Port } from "@stackra/contracts";

/**
 * Encrypts one counter value.
 *
 * @example
 * const encrypted = await cipher.encrypt("till_1", "2024-17", 1_234_56);
 */
export abstract class TurnoverCipher extends Port {
  /** Type-only port key. */
  declare readonly "~key": "fiscal.TurnoverCipher";

  /** Base64 of the encrypted counter (in minor units) for this receipt number. */
  abstract encrypt(unitId: string, receiptNumber: string, turnoverMinor: number): Promise<string>;
}
