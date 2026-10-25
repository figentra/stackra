/**
 * Stackra file contract:
 * Purpose: `WebhookEndpointService`, the module service over `WebhookEndpoint`: registers a scope's receiver, finds
 *          the enabled endpoints of a scope node subscribed to an event, rotates an endpoint's signing secret and
 *          disables an endpoint whose delivery dead-lettered.
 * Boundary: a `CrudService<WebhookEndpoint>`, so every read and write runs in the caller's transaction. The table has
 *           no row-level-security policy, so every read here names its scope node. It stores secret names only; the
 *           caller that creates a secret (a console action) puts its value in the secret store. A registered URL is
 *           https; whether its host is reachable or private is the runtime's egress policy, not checked here.
 * Runtime: node
 * Governing contract: ADR 0224 (decisions 1 to 3); ADR 0308 (rule 17); ADR 0327 (decisions 3 and 9); ADR 0105 as
 *                     amended by ADR 0294.
 */
import { InputInvalidError } from "@stackra/actions";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { CrudService } from "@stackra/database";

import type { WebhookEndpoint } from "#node/models/webhook-endpoint.model";

/** Whether `url` is an absolute https URL. */
const isHttpsUrl = (url: string): boolean =>
  URL.canParse(url) && new URL(url).protocol === "https:";

/**
 * Registers, finds, rotates and disables endpoints.
 *
 * @example
 * await endpoints.register({ scope, url: "https://hooks.acme.example/in", events: ["orders.order.paid.v1"], secretName });
 * const subscribed = await endpoints.subscribedTo(scope.id, "orders.order.paid.v1");
 */
export class WebhookEndpointService extends CrudService<WebhookEndpoint> {
  /**
   * Stores an enabled endpoint of `draft.scope`.
   *
   * @throws InputInvalidError with field errors when the URL is not https or no event is subscribed.
   */
  register(draft: {
    readonly scope: ScopeRef;
    readonly url: string;
    readonly events: readonly string[];
    readonly secretName: string;
  }): Promise<WebhookEndpoint> {
    const fieldErrors = {
      ...(isHttpsUrl(draft.url) ? {} : { url: "webhook_url_invalid" }),
      ...(draft.events.length > 0 ? {} : { events: "webhook_events_empty" }),
    };
    if (Object.keys(fieldErrors).length > 0) throw InputInvalidError.create({}, { fieldErrors });
    return this.insert({
      scopeId: draft.scope.id,
      scopePath: draft.scope.path,
      url: draft.url,
      events: [...draft.events],
      secretName: draft.secretName,
      previousSecretName: null,
      rotatedAt: null,
      disabledAt: null,
    });
  }

  /** The enabled endpoints of scope node `scopeId` that subscribe to the event wire name `type`. */
  async subscribedTo(scopeId: string, type: string): Promise<WebhookEndpoint[]> {
    const endpoints = await this.find({ scopeId: scopeId as PublicId<"scp">, disabledAt: null });
    return endpoints.filter((endpoint) => endpoint.events.includes(type));
  }

  /**
   * Makes `secretName` the signing secret of endpoint `id`; the replaced one still signs for 24 hours.
   *
   * @throws NotFoundError when there is no such endpoint.
   */
  async rotate(id: PublicId<"whe">, secretName: string, at: Date): Promise<WebhookEndpoint> {
    const endpoint = await this.findOneOrFail({ id });
    return this.update(
      { id },
      { previousSecretName: endpoint.secretName, secretName, rotatedAt: at },
    );
  }

  /** Stops delivery to endpoint `id` at `at`; an endpoint already disabled or removed is left as it is. */
  async disable(id: PublicId<"whe">, at: Date): Promise<void> {
    const endpoint = await this.findOne({ id });
    if (endpoint !== null && endpoint.disabledAt === null)
      await this.update({ id }, { disabledAt: at });
  }
}
