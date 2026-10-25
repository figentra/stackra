/**
 * Stackra file contract:
 * Purpose: `InAppStoreFake`, the test double of the `InAppStore` port: inboxes in memory, one per recipient, with the
 *          port's rules: a repeated idempotency key appends nothing, `list` is newest first, and `markRead` touches the
 *          named recipient's entries only.
 * Boundary: a plain subclass of the port, so it binds in place of `InAppStore` (`.override(InAppStore, new
 *           InAppStoreFake())`) and `instanceof InAppStore` holds; not a driver, so gen never offers it as a
 *           candidate. Ids are `inm_<n>` across every inbox; `createdAt` and `readAt` read `Date` when called, so
 *           `freezeClock` pins them.
 * Runtime: node
 * Governing contract: ADR 0266 (decision 2: a fake per capability); ADR 0269 (decision 3).
 */
import type { PublicId } from "@stackra/contracts";

import { InAppStore } from "#contracts/index";
import type { InAppEntry, InAppMessage } from "#contracts/index";

/**
 * In-app inboxes a test reads back.
 *
 * @example
 * const inbox = new InAppStoreFake();
 * const entry = await inbox.append(principalId, { kind: "order_paid", data: { orderId } }, "k1");
 * await inbox.markRead(principalId, entry.id);
 */
export class InAppStoreFake extends InAppStore {
  /** Every entry by recipient, oldest first. */
  private readonly inboxes = new Map<PublicId<"usr">, InAppEntry[]>();

  /** Recipient and idempotency key to the id of the entry they appended. */
  private readonly keys = new Map<string, PublicId>();

  /** The number of entries appended, for the next id. */
  private count = 0;

  append(
    recipient: PublicId<"usr">,
    message: InAppMessage,
    idempotencyKey: string,
  ): Promise<InAppEntry> {
    const key = `${recipient}\u0000${idempotencyKey}`;
    const existing = this.inboxes.get(recipient)?.find((entry) => entry.id === this.keys.get(key));
    if (existing !== undefined) return Promise.resolve(existing);
    this.count += 1;
    const entry: InAppEntry = Object.freeze({
      kind: message.kind,
      data: Object.freeze({ ...message.data }),
      id: `inm_${this.count}`,
      createdAt: new Date(),
      readAt: null,
    });
    this.inboxes.set(recipient, [...(this.inboxes.get(recipient) ?? []), entry]);
    this.keys.set(key, entry.id);
    return Promise.resolve(entry);
  }

  list(
    recipient: PublicId<"usr">,
    options: { readonly unreadOnly?: boolean; readonly limit?: number } = {},
  ): Promise<readonly InAppEntry[]> {
    const entries = (this.inboxes.get(recipient) ?? [])
      .filter((entry) => options.unreadOnly !== true || entry.readAt === null)
      .reverse();
    return Promise.resolve(options.limit === undefined ? entries : entries.slice(0, options.limit));
  }

  markRead(recipient: PublicId<"usr">, id: PublicId): Promise<boolean> {
    const entries = this.inboxes.get(recipient) ?? [];
    const index = entries.findIndex((entry) => entry.id === id);
    const entry = entries[index];
    if (entry === undefined) return Promise.resolve(false);
    if (entry.readAt === null) entries[index] = Object.freeze({ ...entry, readAt: new Date() });
    return Promise.resolve(true);
  }
}
