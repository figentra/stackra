/**
 * Stackra file contract:
 * Purpose: the `InAppStore` port: a person's in-app inbox: append a message for a recipient, list their messages and
 *          mark one read. Each entry carries its product, and a list can be limited to one product.
 * Boundary: an abstract class that is its own token. Every method names the recipient, and a driver answers and
 *           changes that recipient's entries only, so one person never reads or marks another's. Drivers live where
 *           the inbox is stored (the notifications service), selected by config; this package ships the port and a
 *           test double in `./testing` only. `append` deduplicates on the idempotency key, so a retried delivery job
 *           never appends twice. A list with `product` answers that product's entries only, which is how an inbox per
 *           product and an ethical wall between products read it.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1); ADR 0294 (decisions 15, 16 and 17); ADR 0305 (rule 8); ADR 0266; ADR 0422
 *                     (decision 2).
 */
import { Port, type PublicId } from "@stackra/contracts";

import type { InAppEntry } from "#contracts/types/in-app-entry.type";
import type { InAppMessage } from "#contracts/types/in-app-message.type";

/**
 * Keeps in-app inboxes.
 *
 * @example
 * export class PostgresInAppStoreDriver extends Driver(InAppStore) {
 *   append(recipient, message, idempotencyKey) { ... }
 *   list(recipient, options) { ... }
 *   markRead(recipient, id) { ... }
 * }
 */
export abstract class InAppStore extends Port {
  /**
   * Appends `message` to `recipient`'s inbox once per `idempotencyKey`; a repeated key returns the first entry and
   * appends nothing.
   */
  abstract append(
    recipient: PublicId<"usr">,
    message: InAppMessage,
    idempotencyKey: string,
  ): Promise<InAppEntry>;

  /**
   * `recipient`'s entries, newest first: at most `limit` (all when absent), only unread ones with `unreadOnly`, only
   * product `product`'s with `product`.
   */
  abstract list(
    recipient: PublicId<"usr">,
    options?: { readonly unreadOnly?: boolean; readonly limit?: number; readonly product?: string },
  ): Promise<readonly InAppEntry[]>;

  /**
   * Marks `recipient`'s entry `id` read; marking a read entry again keeps its first `readAt`.
   *
   * @returns false when `recipient` has no entry `id`.
   */
  abstract markRead(recipient: PublicId<"usr">, id: PublicId): Promise<boolean>;
}
