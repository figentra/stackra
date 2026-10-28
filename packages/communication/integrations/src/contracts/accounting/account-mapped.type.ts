/**
 * Stackra file contract:
 * Purpose: `AccountMapped`, what an accounting Connection implements beside `AccountingProvider` so its account
 *          mapping travels with it: `accountMap()` reads the mapping the tenant keeps on that Connection.
 * Boundary: an interface a provider Connection implements (an OS integrations connector, ADR 0443 decision 7), not a
 *           container port. Where the Connection stores the map (a field of its record, a settings row) is its own
 *           business; `postMappedJournal` reads it once per post.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decision 2); ADR 0443 (decisions 7 and 8); STA-794 (account mapping per Connection).
 */
import type { AccountMap } from "#contracts/accounting/account-map.type";

/**
 * A Connection that holds the tenant's account mapping.
 *
 * @example
 * export class LedgerConnection extends Connection<LedgerIntegration> implements AccountingProvider, AccountMapped { … }
 */
export interface AccountMapped {
  /** The mapping the tenant keeps on this Connection. */
  accountMap: () => Promise<AccountMap>;
}
