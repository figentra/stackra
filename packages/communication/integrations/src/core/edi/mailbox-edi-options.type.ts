/**
 * Stackra file contract:
 * Purpose: `MailboxEdiOptions`, the per-Connection settings of a `MailboxEdiConnector`: the syntax, our interchange id,
 *          the version and whether interchanges are test ones.
 * Boundary: a type only. The values are Connection data the tenant or the managed-provisioning template sets (our id is
 *           the one the trading partner or the network registered), never code.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 4); ADR 0355 (decision 1: per-Connection data); stackra-46 re-scope.
 */
import type { EdiSyntax } from "#contracts/edi/edi-syntax.enum";

/** How a mailbox Connection envelopes. */
export interface MailboxEdiOptions {
  /** X12 or EDIFACT. */
  readonly syntax: EdiSyntax;

  /** Our party as `<qualifier>:<id>` (`ZZ:FIGENTRA`, `14:6291041500213`). */
  readonly sender: string;

  /** X12: the ISA12 version (`00401`); EDIFACT: the message version (`D:96A:UN`). */
  readonly version: string;

  /** Send test interchanges (ISA15 `T`, UNB 0035 `1`). */
  readonly test: boolean;
}
