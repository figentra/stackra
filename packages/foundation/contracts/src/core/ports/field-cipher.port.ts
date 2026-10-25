/**
 * Stackra file contract:
 * Purpose: the FieldCipher port: seals one string field for storage and opens it again, so a model's encrypted fields
 *          never hold plaintext at rest.
 * Boundary: an abstract class that is its own token; the AES-GCM driver over a `KeyProvider` ships here. The sealed form
 *           carries the id of the key that sealed it, so rotation still reads old rows. `context` binds a sealed value
 *           to where it belongs (such as `table.column`), so it opens only there.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17), ADR 0173 (nobody reads a value); registry gaps R-27 and R-36
 *                     (owner decision 23).
 */
import { Port } from "#core/bases/port.base";

/** Seals and opens string fields. */
export abstract class FieldCipher extends Port {
  /** The sealed form of `plain`, bound to `context`. */
  abstract seal(plain: string, context: string): Promise<string>;

  /**
   * The plain text of `sealed`.
   *
   * @throws when `sealed` is malformed, was sealed for another `context`, or its key is unknown.
   */
  abstract open(sealed: string, context: string): Promise<string>;
}
