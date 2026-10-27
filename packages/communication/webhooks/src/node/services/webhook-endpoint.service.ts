/**
 * Stackra file contract:
 * Purpose: `WebhookEndpointService`, the module service over `WebhookEndpoint`: registers a scope's receiver (an https
 *          URL, or an `s3://bucket/prefix` target), finds the enabled endpoints of a scope node subscribed to an event,
 *          rotates an endpoint's signing secret and disables an endpoint whose delivery dead-lettered. A gated event
 *          (an entitlement named at registration) is subscribed to, and delivered, only on a plan that includes it.
 * Boundary: a `CrudService<WebhookEndpoint>`, so every read and write runs in the caller's transaction. The table has
 *           no row-level-security policy, so every read here names its scope node. It stores secret names only; the
 *           caller that creates a secret (a console action) puts its value in the secret store. A registered URL is
 *           https or a well-formed `s3:` target; whether its host is reachable or private is the runtime's egress
 *           policy, not checked here. Grants are read through `WebhookEntitlementSource`; with none bound no gated
 *           event is granted (fail closed). The fan-out rechecks, so a downgraded plan stops a gated stream at once.
 * Runtime: node
 * Governing contract: ADR 0224 (decisions 1 to 3); ADR 0308 (rule 17); ADR 0327 (decisions 3 and 9); ADR 0105 as
 *                     amended by ADR 0294; ADR 0422 (decision 4).
 */
import { InputInvalidError } from "@stackra/actions";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { CrudService } from "@stackra/database";
import { EntitlementRequiredError } from "@stackra/errors";

import type { WebhookEntitlementSource } from "#contracts/index";
import { s3TargetOf } from "#core/index";
import { OUTBOUND_EVENT_ENTITLEMENTS } from "#node/constants/outbound-event-entitlements.constant";
import type { WebhookEndpoint } from "#node/models/webhook-endpoint.model";

/** Whether `url` is an absolute https URL or a well-formed `s3:` target. */
const isDeliveryUrl = (url: string): boolean => {
  if (url.startsWith("s3:")) {
    try {
      return s3TargetOf(url) !== undefined;
    } catch {
      return false;
    }
  }
  return URL.canParse(url) && new URL(url).protocol === "https:";
};

/**
 * Registers, finds, rotates and disables endpoints.
 *
 * @example
 * await endpoints.register({ scope, url: "https://hooks.acme.example/in", events: ["orders.order.paid.v1"], secretName });
 * const subscribed = await endpoints.subscribedTo(scope.id, "orders.order.paid.v1");
 */
export class WebhookEndpointService extends CrudService<WebhookEndpoint> {
  /** The scope's grants; none bound means no gated event is granted. */
  private readonly entitlements: WebhookEntitlementSource | undefined;

  /**
   * @param entitlements - the selected entitlement source; gen's wiring always passes it.
   */
  constructor(entitlements?: WebhookEntitlementSource) {
    super();
    this.entitlements = entitlements;
  }

  /**
   * Stores an enabled endpoint of `draft.scope`.
   *
   * @throws InputInvalidError with field errors when the URL is neither https nor an `s3:` target, or no event is
   *         subscribed.
   * @throws EntitlementRequiredError (field error `events`) when a subscribed event is gated by an entitlement the
   *         scope lacks; nothing is stored.
   */
  async register(draft: {
    readonly scope: ScopeRef;
    readonly url: string;
    readonly events: readonly string[];
    readonly secretName: string;
  }): Promise<WebhookEndpoint> {
    const fieldErrors = {
      ...(isDeliveryUrl(draft.url) ? {} : { url: "webhook_url_invalid" }),
      ...(draft.events.length > 0 ? {} : { events: "webhook_events_empty" }),
    };
    if (Object.keys(fieldErrors).length > 0) throw InputInvalidError.create({}, { fieldErrors });
    const granted = await this.grantedEvents(draft.events, draft.scope.id);
    if (draft.events.some((event) => !granted.has(event)))
      throw EntitlementRequiredError.create(
        {},
        { fieldErrors: { events: "entitlement_required" } },
      );
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

  /**
   * The enabled endpoints of scope node `scopeId` that subscribe to the event wire name `type`; none when `type` is
   * gated by an entitlement the scope no longer holds.
   */
  async subscribedTo(scopeId: string, type: string): Promise<WebhookEndpoint[]> {
    if (!(await this.grantedEvents([type], scopeId)).has(type)) return [];
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

  /** The events of `events` scope node `scopeId` may receive: every ungated one and each gated one it is granted. */
  private async grantedEvents(
    events: readonly string[],
    scopeId: string,
  ): Promise<ReadonlySet<string>> {
    const gates = events.flatMap((event) => {
      const entitlement = OUTBOUND_EVENT_ENTITLEMENTS.get(event);
      return entitlement === undefined ? [] : [entitlement];
    });
    const held =
      gates.length === 0 || this.entitlements === undefined
        ? new Set<string>()
        : await this.entitlements.granted([...new Set(gates)].sort(), scopeId);
    return new Set(
      events.filter((event) => {
        const entitlement = OUTBOUND_EVENT_ENTITLEMENTS.get(event);
        return entitlement === undefined || held.has(entitlement);
      }),
    );
  }
}
