/**
 * Stackra file contract:
 * Purpose: `EdiMailbox`, the port of an EDI transport: an AS2 host, an SFTP drop or a value-added network's mailbox.
 *          It puts outbound interchanges once per name, lists and fetches inbound ones, removes one taken, and hands out
 *          interchange control numbers per partner.
 * Boundary: an abstract class that is its own token, key `integrations.EdiMailbox`. It moves interchange text only and
 *           knows no syntax; `MailboxEdiConnector` envelopes and reads. Every transport driver that names a vendor or
 *           holds certificates (AS2 MDNs, SFTP keys, a VAN's API) is an OS integrations connector (ADR 0443 decision 7);
 *           `MemoryEdiMailbox` in `./testing` is the in-memory one. Ids never contain `#`. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 4); ADR 0443 (decisions 7 and 8); stackra-46 re-scope (R2-7, M6);
 *                     ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";

import type { EdiMailboxPage } from "#contracts/edi/edi-mailbox-page.type";

/**
 * An EDI transport.
 *
 * @example
 * export class SftpEdiMailboxDriver extends Driver(EdiMailbox) { … }
 */
export abstract class EdiMailbox extends Port {
  /** Type-only port key. */
  declare readonly "~key": "integrations.EdiMailbox";

  /** Sends `interchange` under `name`; a name already sent returns the first id and sends nothing. */
  abstract put(name: string, interchange: string): Promise<{ readonly id: string }>;

  /** The interchanges received since `since` and not yet removed, a page at a time. */
  abstract list(since: Date, cursor?: string): Promise<EdiMailboxPage>;

  /** The interchange `id`, or undefined once it was removed. */
  abstract get(id: string): Promise<string | undefined>;

  /** Removes the received interchange `id`, so it is not listed again; an unknown id is a no-op. */
  abstract remove(id: string): Promise<void>;

  /** The next interchange control number for `partner` (`<qualifier>:<id>`), never handed out twice. */
  abstract nextControlNumber(partner: string): Promise<number>;
}
