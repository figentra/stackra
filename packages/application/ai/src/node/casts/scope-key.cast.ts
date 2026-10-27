/**
 * Stackra file contract:
 * Purpose: `ScopeKeyCast`, the tenant-key encryption cast of the ai tables: seals a column's value with the
 *          `FieldCipher` (whose `KeyProvider` serves the tenant's data key, ADR 0188) bound to the table, the column and
 *          the owning tenant, and opens it again; a value copied to another column or another tenant's row does not
 *          open.
 * Boundary: a service over the `FieldCipher` port, so no key or value passes through here and nothing is logged. The
 *           binding is the cipher's authenticated context `<schema>.<table>.<column>@<scopeId>`, never stored. An
 *           empty tenant id is refused: sealing without an owner would bind the value to every tenant.
 * Runtime: node
 * Governing contract: ADR 0100 (decision 9: conversations are encrypted); ADR 0188 (decision 2: data keys per
 *                     environment and tenant); ADR 0173 (nobody reads a value); STA-781.
 */
import { Service } from "@stackra/container";
import type { FieldCipher } from "@stackra/contracts";

/**
 * Seals and opens tenant-owned columns.
 *
 * @example
 * const sealed = await cast.seal(JSON.stringify(message), { column: "ai.messages.content", scopeId });
 * const message = JSON.parse(await cast.open(row.content, { column: "ai.messages.content", scopeId: row.tenantId }));
 */
export class ScopeKeyCast extends Service {
  /** The field cipher over the tenant's data keys. */
  private readonly cipher: FieldCipher;

  /**
   * @param cipher - the bound field cipher.
   */
  constructor(cipher: FieldCipher) {
    super();
    this.cipher = cipher;
  }

  /**
   * The sealed form of `plain` for `column` of `scopeId`'s row.
   *
   * @throws TypeError when `scopeId` or `column` is empty.
   */
  seal(
    plain: string,
    where: { readonly column: string; readonly scopeId: string },
  ): Promise<string> {
    return this.cipher.seal(plain, this.context(where));
  }

  /**
   * The plain text of `sealed`.
   *
   * @throws TypeError when `scopeId` or `column` is empty; the cipher's error when `sealed` belongs elsewhere.
   */
  open(
    sealed: string,
    where: { readonly column: string; readonly scopeId: string },
  ): Promise<string> {
    return this.cipher.open(sealed, this.context(where));
  }

  /** The authenticated context of `where`. */
  private context(where: { readonly column: string; readonly scopeId: string }): string {
    if (where.column === "" || where.scopeId === "")
      throw new TypeError("ScopeKeyCast needs a column and the owning tenant's id");
    return `${where.column}@${where.scopeId}`;
  }
}
