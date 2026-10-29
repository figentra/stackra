/**
 * Stackra file contract:
 * Purpose: `ZitadelAuthEventsService`, the receiving end of a ZITADEL Actions v2 event target: each signed call
 *          carrying a sign-in, second-factor, lockout or sign-out event becomes one entry of the scope's audit hash
 *          chain, written through the `AuditTrail` port (the `postgres` driver chains it), so auth events sit in the
 *          same verifiable chain as the actions they precede.
 * Boundary: the trust boundary: the `ZITADEL-Signature` header is verified over the raw body with
 *           `IdpAdminConfig.eventsSigningKey` before anything is parsed; an unset key, a bad or stale signature is 401,
 *           a body that is not a ZITADEL event is 400, a method other than POST is 405. An event type outside
 *           `ZITADEL_AUTH_EVENTS` is acknowledged (204) and not recorded. The scope is the host's: the caller passes
 *           `scopeOf`, which turns the event's organisation (`resourceOwner`) into its scope node (the claim action's
 *           mapping lives in the identity service, not here); an organisation with no scope reaches the store with no
 *           tenant and is logged there as `audit_write_skipped`. The actor is the verified webhook source; the
 *           subject is the provider's user id in `fields`, ids only: the event's own payload (IP, user agent) is never
 *           stored. A failed write throws (the host's endpoint answers 5xx), so ZITADEL retries; a retried event is
 *           written again with the same `callId`, which a reader dedupes on. The host serves it from a raw endpoint
 *           (identity cannot import @stackra/app).
 * Runtime: node
 * Governing contract: ADR 0212 (decision 3: the audit chain); ADR 0136 (decision 5); ADR 0465 (decision 4); ADR 0206;
 *                     ADR 0224 as amended (verify before parse, raw body); ZITADEL Actions v2 (event executions);
 *                     STA-1579.
 */
import type { AuditTrail } from "@stackra/actions/contracts";
import { Service } from "@stackra/container";
import { ActorKind, ApiArea } from "@stackra/contracts";
import type { Actor, PublicId } from "@stackra/contracts";
import { z } from "zod";

import type { IdpAdminConfig } from "#config/idp-admin.config";
import { IdpAuthEvent } from "#contracts/enums/idp-auth-event.enum";
import { ZITADEL_AUTH_EVENTS } from "#core/constants/zitadel-auth-events.constant";
import { verifyZitadelSignature } from "#core/functions/verify-zitadel-signature.function";

/** The fields of a ZITADEL event execution call this service reads. */
const ZITADEL_EVENT = z.object({
  aggregateID: z.string().min(1).max(64),
  aggregateType: z.string().max(64),
  resourceOwner: z.string().min(1).max(64),
  sequence: z.number().int().nonnegative(),
  event_type: z.string().min(1).max(200),
  created_at: z.coerce.date(),
  userID: z.string().max(64).optional(),
});

/** The public id of the verified webhook source every entry is attributed to. */
const ZITADEL_ACTOR_ID: PublicId = "whk_zitadel";

/** The events that end as a refusal (their code is the event's). */
const REFUSED: ReadonlySet<IdpAuthEvent> = new Set([
  IdpAuthEvent.SignInFailed,
  IdpAuthEvent.SecondFactorFailed,
  IdpAuthEvent.Locked,
]);

/** The organisation's scope node, or undefined when the organisation has none. */
type ScopeOf = (organizationId: string) => Promise<PublicId | undefined>;

/**
 * Turns ZITADEL auth events into audit chain entries.
 *
 * @example
 * export class IdpEventsController extends Controller({ path: "/webhooks/zitadel/auth-events" }) {
 *   constructor(private readonly events: ZitadelAuthEventsService, private readonly orgs: OrgScopes) { super(); }
 *   handle(request: Request): Promise<Response> { return this.events.handle(request, (o) => this.orgs.scopeOf(o)); }
 * }
 */
export class ZitadelAuthEventsService extends Service {
  /** The signing key of the target. */
  private readonly config: IdpAdminConfig;

  /** The chained audit store. */
  private readonly audit: AuditTrail;

  /**
   * @param config - the identity provider configuration, for `eventsSigningKey`.
   * @param audit - the audit store; its `postgres` driver chains each entry per scope.
   */
  constructor(config: IdpAdminConfig, audit: AuditTrail) {
    super();
    this.config = config;
    this.audit = audit;
  }

  /**
   * Verifies, maps and records one event call.
   *
   * @param request - the target's POST, body untouched.
   * @param scopeOf - the host's organisation-to-scope mapping.
   * @throws whatever the audit store throws, so the provider retries.
   */
  async handle(request: Request, scopeOf: ScopeOf): Promise<Response> {
    if (request.method.toUpperCase() !== "POST") return new Response(null, { status: 405 });
    const body = await request.text();
    const signature = request.headers.get("zitadel-signature");
    if (!(await verifyZitadelSignature(signature, body, this.config.eventsSigningKey, Date.now())))
      return new Response(null, { status: 401 });
    let json: unknown;
    try {
      json = JSON.parse(body);
    } catch {
      return new Response(null, { status: 400 });
    }
    const parsed = ZITADEL_EVENT.safeParse(json);
    if (!parsed.success) return new Response(null, { status: 400 });
    const event = parsed.data;
    const recorded = Object.hasOwn(ZITADEL_AUTH_EVENTS, event.event_type)
      ? ZITADEL_AUTH_EVENTS[event.event_type]
      : undefined;
    if (recorded === undefined) return new Response(null, { status: 204 });
    const scopeId = await scopeOf(event.resourceOwner);
    const actor: Actor = {
      kind: ActorKind.Webhook,
      id: ZITADEL_ACTOR_ID,
      ...(scopeId === undefined ? {} : { scopeId }),
    };
    const refused = REFUSED.has(recorded);
    await this.audit.record({
      call: {
        callId: `zitadel_${event.aggregateID}_${event.sequence}`,
        type: ZitadelAuthEventsService,
        kind: "action",
        key: `identity.idp_auth_event.${recorded}@1`,
        actor,
        ...(scopeId === undefined ? {} : { scopeId }),
        area: ApiArea.Platform,
      },
      at: event.created_at,
      outcome: refused ? "refused" : "ok",
      ...(refused ? { code: recorded } : {}),
      fields: {
        idpEvent: event.event_type,
        idpUserId: event.aggregateType === "user" ? event.aggregateID : (event.userID ?? null),
        idpOrganizationId: event.resourceOwner,
        idpSequence: event.sequence,
      },
    });
    return new Response(null, { status: 204 });
  }
}
