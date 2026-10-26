/**
 * Stackra file contract:
 * Purpose: the `MailTransport` port: hands one rendered mail to a mail provider and returns the provider's id for it.
 * Boundary: an abstract class that is its own token. Drivers live where the provider credentials do (the notifications
 *           service: `memory` and `resend`), selected by config through runway (ADR 0266); this package ships the
 *           port and a test double in `./testing` only. A driver deduplicates on the idempotency key, so a retried
 *           delivery job never sends twice.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 15, 16 and 17); ADR 0305 (rule 8: `Driver(MailTransport)`); ADR 0266.
 */
import { Port } from "@stackra/contracts";

import type { OutboundMail } from "#contracts/types/outbound-mail.type";

/**
 * Sends outbound mail through a provider.
 *
 * @example
 * export class MemoryMailTransportDriver extends Driver(MailTransport) {
 *   send(mail: OutboundMail, idempotencyKey: string): Promise<string> { ... }
 * }
 */
export abstract class MailTransport extends Port {
  /**
   * Sends `mail` once per `idempotencyKey`; a repeated key returns the first send's id and sends nothing.
   *
   * @returns the provider's id of the sent mail.
   */
  abstract send(mail: OutboundMail, idempotencyKey: string): Promise<string>;
}
