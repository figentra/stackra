/**
 * Stackra file contract:
 * Purpose: `WebhookEndpoint`, one receiver a scope registers for outbound webhooks: its scope node, its https URL, the
 *          wire names of the integration events it subscribes to, the name of its signing secret (and of the one a
 *          rotation replaced), and when delivery to it stopped.
 * Boundary: data plus the rotation rule. Key `webhooks.webhook_endpoint`, table `webhooks.webhook_endpoints`. It holds
 *           secret names only, never a value: the delivery job reads the value blind from the `SecretStore` just
 *           before it signs (ADR 0173). Endpoints are added through `WebhookEndpointService.register`, never with `new`;
 *           the ORM loads rows without running the constructor.
 * Runtime: node
 * Governing contract: ADR 0224 (decisions 1 to 3); ADR 0308 (rule 17: rotation keeps two secrets valid for 24 hours);
 *                     ADR 0327 (decisions 3 and 9: keyed by `scope_id`); ADR 0294 (decisions 4, 11, 20 and 27).
 */
import type { PublicId } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";

/** How long the secret a rotation replaced still signs, in milliseconds. */
const ROTATION_OVERLAP_MS = 24 * 60 * 60 * 1000;

/** A registered receiver. Traits add `id` and the timestamps; the indexes are the migration's. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class WebhookEndpoint extends Model.with(HasPublicId("whe"), Timestamps) {
  /** The scope node whose events the endpoint receives. */
  scopeId!: PublicId<"scp">;

  /** That node's `ltree` path, denormalised for the delivery job's scope session. */
  scopePath!: string;

  /** The receiver's https URL. */
  url!: string;

  /** The wire names of the integration events it subscribes to (`orders.order.paid.v1`). */
  events!: readonly string[];

  /** The name of the signing secret in the secret store; never its value. */
  secretName!: string;

  /** The name of the secret the last rotation replaced; `null` before the first rotation. */
  previousSecretName!: string | null;

  /** When the signing secret was last rotated; `null` before the first rotation. */
  rotatedAt!: Date | null;

  /** When delivery stopped after a dead-lettered delivery; `null` while enabled. */
  disabledAt!: Date | null;

  /**
   * The names of the secrets a delivery at `now` is signed with: the current one, plus the replaced one for 24 hours
   * after a rotation, so a receiver that has not switched yet still verifies.
   */
  secretNamesAt(now: Date): readonly string[] {
    const { previousSecretName, rotatedAt } = this;
    return previousSecretName !== null &&
      rotatedAt !== null &&
      now.getTime() - rotatedAt.getTime() < ROTATION_OVERLAP_MS
      ? [this.secretName, previousSecretName]
      : [this.secretName];
  }
}

/** The insert-optional fields of `WebhookEndpoint`, merged into the model class (MikroORM `[OptionalProps]`). */
// shortcut: the `[OptionalProps]` augmentation is written by hand so `CrudService.insert` may leave the trait timestamps
// out; remove it once gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface WebhookEndpoint {
  /** The fields an insert may leave out: minted ids, trait-filled columns and defaulted fields. */
  [OptionalProps]?: "createdAt" | "updatedAt";
}
