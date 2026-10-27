/**
 * Stackra file contract:
 * Purpose: `AccountMap`, a Connection's account mapping: our account keys (the ones a source journal names, such as
 *          `receivables` or `sales`) to the codes of the tenant's chart in the accounting provider, and our tax keys to
 *          the provider's tax codes.
 * Boundary: a type only, data the tenant edits per Connection (STA-794) and the industry template seeds; never a
 *           constant in code. An absent key is unmapped, and `mapJournal` refuses it rather than guessing.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decision 2); ADR 0443 (decisions 8 and 10); Juristra services-and-packages.
 */

/**
 * The tenant's mapping for one accounting Connection.
 *
 * @example
 * const map: AccountMap = { accounts: { receivables: "1100", sales: "4000", vat_output: "2200" }, taxCodes: { vat_standard: "OUTPUT2" } };
 */
export interface AccountMap {
  /** Our account key to the provider's account code. */
  readonly accounts: Readonly<Record<string, string>>;

  /** Our tax key to the provider's tax code; left out when no line carries tax. */
  readonly taxCodes?: Readonly<Record<string, string>>;
}
