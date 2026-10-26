/**
 * Stackra file contract:
 * Purpose: `SEND_MESSAGE_ACTION`, the descriptor of the notifications service's `messages.message.send@1`
 *          (`POST /messages`): the rendered parts of one mail for one principal, answered with the message id.
 * Boundary: internal to `./node`; the same descriptor gen writes into a host's `#stackra/clients/notifications` from
 *           the service's manifest, which this package cannot import. Its input schema is the service's
 *           `SendMessageInput`; a change there is a new action version, so this key changes with it.
 * Runtime: node
 * Governing contract: ADR 0260 (decisions 3, 4 and 6); ADR 0223; ADR 0134 (a principal id, never an address).
 */
import { remoteAction } from "@stackra/clients";
import { HttpMethod } from "@stackra/contracts";
import { publicId } from "@stackra/validation";
import { z } from "zod";

/**
 * The remote action `messages.message.send@1`.
 *
 * @example
 * readonly message = { send: this.member(SEND_MESSAGE_ACTION) };
 */
export const SEND_MESSAGE_ACTION = remoteAction("messages.message.send@1", {
  input: z.object({
    mail: z.string().regex(/^[a-z][a-z0-9_]*$/),
    to: z.object({ principalId: publicId("usr") }),
    subject: z.string().min(1).max(200),
    html: z.string().min(1),
    text: z.string().min(1),
  }),
  output: z.object({ messageId: publicId("msg") }),
  endpoint: { method: HttpMethod.Post, path: "/messages" },
});
