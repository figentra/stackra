/**
 * Stackra file contract:
 * Purpose: `SEND_DELIVERY_MESSAGE_ACTION`, the descriptor of the notifications service's `delivery.message.send@1`
 *          (`POST /messages`): one notification for one person (its key, its category code, the template values,
 *          optionally the rendered mail, and the Market), answered with the message id and its status.
 * Boundary: internal to `./node`; mirrors the service's `SendMessageInput`, which this package cannot import. `to`
 *           is a principal or, for a person with no account, a mail address (ADR 0422 as amended); the service takes
 *           the address form once it ships its recipient-by-address shape. A change there is a new action version.
 * Runtime: node
 * Governing contract: ADR 0260 (decisions 3, 4 and 6); ADR 0223; ADR 0134; ADR 0422 (as amended by STA-1235).
 */
import { remoteAction } from "@stackra/clients";
import { HttpMethod } from "@stackra/contracts";
import { publicId } from "@stackra/validation";
import { z } from "zod";

/**
 * The remote action `delivery.message.send@1`.
 *
 * @example
 * new NotificationsClient(transport).send(SEND_DELIVERY_MESSAGE_ACTION).queue(input);
 */
export const SEND_DELIVERY_MESSAGE_ACTION = remoteAction("delivery.message.send@1", {
  input: z.object({
    notification: z
      .string()
      .regex(/^[a-z][a-z0-9_.]*$/)
      .max(96),
    category: z
      .string()
      .regex(/^[a-z][a-z0-9_]*$/)
      .max(64),
    to: z.union([z.object({ principalId: publicId("usr") }), z.object({ email: z.email() })]),
    data: z.record(z.string(), z.union([z.string(), z.number()])),
    mail: z
      .object({
        subject: z.string().min(1).max(200),
        html: z.string().min(1),
        text: z.string().min(1),
      })
      .nullable(),
    market: z
      .string()
      .regex(/^[a-z]{2}(-[a-z0-9]+)?$/)
      .nullable(),
  }),
  output: z.object({ messageId: publicId("msg"), status: z.string() }),
  endpoint: { method: HttpMethod.Post, path: "/messages" },
});
