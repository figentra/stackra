/**
 * Stackra file contract:
 * Purpose: `WebhookDeliveryPermissions`, the permissions of the delivery log model: `webhooks.webhook_delivery.<verb>`,
 *          each with its risk.
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static. `send` is what `DeliverWebhookAction` (`webhook_delivery.send`) derives.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); ADR 0224 (decision 3).
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `WebhookDeliveryPermissions.send`.
 *
 * @example
 * export class DeliverWebhookAction extends Action({ key: "webhook_delivery.send", actors: [ActorKind.Job] }) {}
 */
export class WebhookDeliveryPermissions extends Permissions {
  /** Deliver one event to one receiver; the delivery job runs it, so it is held only by the platform. */
  static readonly send = Permission.L1.system();
}
