/**
 * Stackra file contract:
 * Purpose: `MemoryEdiMailboxDriver`, the in-memory `EdiMailbox`: what is put is kept once per name in `sent`, `deliver`
 *          plays a trading partner dropping an interchange in the inbox, and control numbers count up per partner.
 * Boundary: the driver named `memory`; no transport and no certificate. `list` returns one page (no cursor). Its
 *           constructor takes no data (ADR 0294 rule 17). Production transports (AS2, SFTP, a VAN) are OS integrations
 *           connectors (ADR 0443 decision 7). Exported from `.`, like `MemoryAudioDeviceDriver`.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2: a memory driver per capability); ADR 0447 (decision 4); ADR 0294
 *                     (decision 16).
 */
import { Driver } from "@stackra/container";

import { EdiMailbox } from "#contracts/edi/edi-mailbox.port";
import type { EdiMailboxPage } from "#contracts/edi/edi-mailbox-page.type";

/**
 * A mailbox in memory.
 *
 * @example
 * const mailbox = new MemoryEdiMailboxDriver();
 * mailbox.deliver("in_1", x12Order);
 * const page = await new MailboxEdiConnector(mailbox, options).receive(new Date(0));
 */
export class MemoryEdiMailboxDriver extends Driver(EdiMailbox) {
  /** Name to the interchange put under it, first put wins. */
  readonly sent = new Map<string, string>();

  /** Received id to its interchange and arrival, until removed. */
  readonly inbox = new Map<string, { readonly interchange: string; readonly at: Date }>();

  /** Partner to the last control number handed out. */
  private readonly controls = new Map<string, number>();

  /** Drops `interchange` in the inbox under `id`, as a partner would. */
  deliver(id: string, interchange: string, at: Date = new Date()): void {
    this.inbox.set(id, { interchange, at });
  }

  /** Keeps `interchange` under `name` once; the id is the name. */
  async put(name: string, interchange: string): Promise<{ readonly id: string }> {
    if (!this.sent.has(name)) this.sent.set(name, interchange);
    return { id: name };
  }

  /** Every inbox interchange that arrived at or after `since`, oldest first. */
  async list(since: Date, _cursor?: string): Promise<EdiMailboxPage> {
    const files = [...this.inbox]
      .filter(([, file]) => file.at >= since)
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort(([, a], [, b]) => a.at.getTime() - b.at.getTime())
      .map(([id, file]) => ({ id, interchange: file.interchange }));
    return { files };
  }

  /** The inbox interchange `id`, or undefined once removed. */
  async get(id: string): Promise<string | undefined> {
    return this.inbox.get(id)?.interchange;
  }

  /** Removes `id` from the inbox. */
  async remove(id: string): Promise<void> {
    this.inbox.delete(id);
  }

  /** 1, 2, 3 … per partner. */
  async nextControlNumber(partner: string): Promise<number> {
    const next = (this.controls.get(partner) ?? 0) + 1;
    this.controls.set(partner, next);
    return next;
  }
}
