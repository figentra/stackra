/**
 * Stackra file contract:
 * Purpose: `EdiCase`, one recorded case an EDI connector must pass: the documents it sends (each twice under one key,
 *          the second must send nothing), the documents it must read from the network since a date, and the
 *          provider's recorded calls for all of it, acknowledgements included.
 * Boundary: a type only. An OS EDI connector (a VAN, an AS2 or SFTP mailbox over HTTP) ships its cases beside its
 *           driver; `certification: "pending"` marks a recording built from public documentation (owner D3,
 *           2026-10-27), `"sandbox"` one captured from a network or partner test run.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0443 (decisions 7 and 8); ADR 0447 (decision 4); STA-795.
 */
import type { EdiDocument } from "#contracts/index";
import type { RecordedExchange } from "#testing/accounting/recorded-exchange.type";

/**
 * A recorded EDI case.
 *
 * @example
 * const po: EdiCase = { name: "order out, invoice in", certification: "pending", sends, since, received, exchanges };
 */
export interface EdiCase {
  /** What the case covers, named in a failure. */
  readonly name: string;

  /** `pending` until the recording is replaced by a sandbox capture. */
  readonly certification: "pending" | "sandbox";

  /** Each document sent, its key and the network id it must get back both times. */
  readonly sends: readonly {
    readonly document: EdiDocument;
    readonly idempotencyKey: string;
    readonly id: string;
  }[];

  /** The date `receive` is called with. */
  readonly since: Date;

  /** The documents `receive` must return over all pages, in order; each is then acknowledged. */
  readonly received: readonly EdiDocument[];

  /** The calls the connector makes, in order: the sends, the receive pages, then the acknowledgements. */
  readonly exchanges: readonly RecordedExchange[];
}
