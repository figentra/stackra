/**
 * Stackra file contract:
 * Purpose: `ErasureMethod`, how a declared personal-data field leaves when its subject is erased: crypto-shredded
 *          (the field is sealed under the subject's own key, and destroying that key's salt makes it unreadable),
 *          deleted with its row, or anonymised (overwritten with null while the row stays).
 * Boundary: an `Enum.of` value plus the type of the same name. A row with any `delete` field is deleted whole; a row
 *           with `anonymise` fields only is edited; `shred` fields change nothing in the row and rely on the key.
 * Runtime: isomorphic
 * Governing contract: ADR 0189 (decision 2: erasure); ADR 0212 (crypto-shredding of an erased subject); ADR 0188
 *                     (decision 2: per-subject keys); STA-1375.
 */
import { Enum } from "@stackra/contracts";

/** How an erased subject's field is disposed of. */
export const ErasureMethod = Enum.of({
  /** Sealed under the subject key; erasure destroys the key's salt, so every copy (backups too) is unreadable. */
  Shred: "shred",
  /** The row holding the field is deleted. */
  Delete: "delete",
  /** The field is overwritten with null; the row stays (an order kept for tax, without the buyer's name). */
  Anonymise: "anonymise",
});

/** One of the codes above. */
export type ErasureMethod = Enum.Value<typeof ErasureMethod>;
