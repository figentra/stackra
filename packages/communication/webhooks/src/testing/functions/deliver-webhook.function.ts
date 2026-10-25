/**
 * Stackra file contract:
 * Purpose: `deliverWebhook(EventClass, payload, { secret, connectionId?, id? })`, which signs a provider payload with a
 *          test secret and delivers it to the testing app compiled last, as the provider would post it to the
 *          Integration's URL: the platform's, or a connection's when `connectionId` is given.
 * Boundary: test only, through the real `WebhookReceiver` (the app's own when it binds one, else one built from the
 *           app's `ConnectionStore`, `SecretStore`, `EventOutbox` and `Clock`), so verification, routing and the outbox
 *           write are the production path; `drainOutbox()` of @stackra/events then runs the listeners. The secret it
 *           signs with is a test value; the app's secret store and connection store hold the ones it is checked
 *           against. The event class must be registered (`registerWebhookEvents`, which gen's entry calls).
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0308 (rules 15 and 16); ADR 0224.
 */
import { SecretStore } from "@stackra/config";
import { Clock } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import type { WebhookEventClass } from "@stackra/events";
import { EventOutbox } from "@stackra/events/contracts";
import { ConnectionStore } from "@stackra/integrations";

import { WEBHOOK_EVENTS } from "#core/constants/webhook-events.constant";
import { signWebhook, WebhookReceiver } from "#core/index";
import { CURRENT_APP } from "#testing/constants/current-app.constant";
import type { WebhookResult } from "#testing/types/webhook-result.type";

/**
 * Delivers one signed webhook of `type`'s Integration.
 *
 * @param payload - the provider's JSON payload, as it would post it.
 * @param options - the test secret to sign with, the connection whose URL it is posted to, and the message id (a fresh
 *                  one when left out; repeat it to test the inbox dedup).
 * @throws Error before any testing app compiled.
 * @throws TypeError when `type` is not registered with `registerWebhookEvents`.
 * @example
 * const result = await deliverWebhook(InboundMailReceived, webhook(), { secret: "wrong" });
 * expect(result).toRefuseWith(refusal(InvalidSignatureError));
 */
export async function deliverWebhook(
  type: WebhookEventClass<object>,
  payload: object,
  options: { readonly secret: string; readonly connectionId?: string; readonly id?: string },
): Promise<WebhookResult> {
  const app = CURRENT_APP.value;
  if (app === undefined)
    throw new Error(
      "No testing app: compile one with createTestingModule(Root).compile() before calling deliverWebhook()",
    );
  const row = WEBHOOK_EVENTS.byEvent.get(type);
  if (row === undefined)
    throw new TypeError(`${type.name} is not registered: gen's entry calls registerWebhookEvents`);
  const clock = app.get(Clock);
  const receiver = app.has(WebhookReceiver)
    ? app.get(WebhookReceiver)
    : new WebhookReceiver(
        app.get(ConnectionStore),
        app.get(SecretStore),
        app.get(EventOutbox),
        clock,
      );
  const body = JSON.stringify(payload);
  const headers = await signWebhook(
    { id: options.id ?? `msg_${crypto.randomUUID()}`, timestamp: clock.now(), body },
    [options.secret],
  );
  try {
    const event = await receiver.receive({
      integration: row.integration,
      ...(options.connectionId === undefined ? {} : { connectionId: options.connectionId }),
      headers: { ...headers },
      body,
    });
    return { ok: true, event };
  } catch (error) {
    if (isRefusal(error)) return { ok: false, error };
    throw error;
  }
}
