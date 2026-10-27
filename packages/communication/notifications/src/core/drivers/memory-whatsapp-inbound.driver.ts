/**
 * Stackra file contract:
 * Purpose: the `memory` driver of the `WhatsAppInbound` port: a dev or test pushes messages, and the next `read` hands
 *          them out, whatever body it is given, so a host's inbound handler runs with no provider.
 * Boundary: keeps messages in the process until read; one queue per container. Never parses a body.
 * Runtime: isomorphic
 * Governing contract: ADR 0448 (decision 1); ADR 0266 (decision 2: memory driver first).
 */
import { Driver } from "@stackra/container";

import { WhatsAppInbound } from "#contracts/ports/whatsapp-inbound.port";
import type { InboundWhatsApp } from "#contracts/types/inbound-whatsapp.type";

/**
 * Inbound WhatsApp messages a test supplies.
 *
 * @example
 * inbound.push({ kind: "text", id: "m1", from: "+966500000001", channelId: "c1", at: now, text: "hi" });
 * await handler.receive("{}"); // reads m1
 */
export class MemoryWhatsAppInboundDriver extends Driver(WhatsAppInbound) {
  /** Messages pushed and not read yet. */
  private queued: InboundWhatsApp[] = [];

  /** Queues `messages` for the next `read`. */
  push(...messages: InboundWhatsApp[]): void {
    this.queued.push(...messages);
  }

  /** The messages pushed since the last read, in push order; `body` is ignored. */
  read(_body: string): Promise<readonly InboundWhatsApp[]> {
    const messages = this.queued;
    this.queued = [];
    return Promise.resolve(messages);
  }
}
