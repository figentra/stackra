/**
 * Stackra file contract:
 * Purpose: `DevicePushTransportDriver`, the `device` `PushTransport`: an Expo push through the host's Expo Integration
 *          for the mobile apps, or a Web Push (VAPID, `aes128gcm`) straight to the browser's push service; a device the
 *          service reports gone (Expo `DeviceNotRegistered`, Web Push 404 or 410) is revoked through `PushTokenStore`.
 *          Expo receipts are read with `receipts`, which revokes the devices they report gone.
 * Boundary: the VAPID key pair and contact are platform secrets read by name (`WEB_PUSH_VAPID_PUBLIC_KEY`,
 *           `WEB_PUSH_VAPID_PRIVATE_KEY`, `WEB_PUSH_VAPID_SUBJECT`), never logged. A Web Push goes only to an https
 *           endpoint, the browser's own push service. Sends are logged by key in `SendLog`. The Expo Integration is a
 *           vendor connector in the OS integrations service (R3-8): the host subclasses this abstract driver and
 *           declares it as `expo`; the constructor takes class tokens only (ADR 0294 rule 17).
 *           Each outcome (sent, revoked, or failed on a provider refusal) is recorded as `DeliveryRecorded` through
 *           the optional `EventOutbox` (stackra-207).
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1: web push with VAPID); RFC 8030; RFC 8291; RFC 8292; ADR 0305 (rule 8);
 *                     owner decision R3-8 (STA-1281); stackra-207 (STA-1360).
 */
import type { SecretStore } from "@stackra/config/contracts";
import { Driver } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import type { EventOutbox } from "@stackra/events/contracts";
import { ProviderRefusedError, ProviderUnavailableError } from "@stackra/integrations";
import type { IntegrationApi } from "@stackra/integrations";

import { NotificationChannel } from "#contracts/enums/notification-channel.enum";
import { PushTransport } from "#contracts/ports/push-transport.port";
import type { PushTokenStore } from "#contracts/ports/push-token-store.port";
import type { SendLog } from "#contracts/ports/send-log.port";
import type { OutboundPush } from "#contracts/types/outbound-push.type";
import type { PushOutcome } from "#contracts/types/push-outcome.type";
import { encryptWebPush } from "#core/functions/encrypt-web-push.function";
import { recordDelivery } from "#core/functions/record-delivery.function";
import { vapidAuthorization } from "#core/functions/vapid-authorization.function";

/** An Expo push ticket or receipt. */
interface ExpoTicket {
  readonly status: "ok" | "error";
  readonly id?: string;
  readonly details?: { readonly error?: string };
}

/** The send log's mark of a push to a device that was gone. */
const REVOKED = "revoked";

/**
 * Pushes to devices.
 *
 * @example
 * const outcome = await push.send({ target, title, body, ttlSeconds: 3600 }, delivery.commandKey);
 */
export abstract class DevicePushTransportDriver extends Driver(PushTransport) {
  /**
   * Expo's push service: the host's Expo Integration (provider `expo`, base URL `https://exp.host`), of which only the
   * managed client is used; declared by the host's subclass.
   */
  protected abstract readonly expo: { readonly api: IntegrationApi };

  /** The VAPID secrets. */
  private readonly secrets: SecretStore;

  /** Forgets dead devices. */
  private readonly tokens: PushTokenStore;

  /** Remembers sent keys. */
  private readonly log: SendLog;

  /** Tells the time, for the VAPID token. */
  private readonly clock: Clock;

  /** Where delivery outcomes are recorded; none records nothing. */
  private readonly outbox: EventOutbox | undefined;

  /**
   * @param secrets - the secret store.
   * @param tokens - the push target store.
   * @param log - the send log.
   * @param clock - the clock.
   * @param outbox - the service's event outbox, which receives one `DeliveryRecorded` per outcome; none records nothing.
   */
  constructor(
    secrets: SecretStore,
    tokens: PushTokenStore,
    log: SendLog,
    clock: Clock,
    outbox?: EventOutbox,
  ) {
    super();
    this.secrets = secrets;
    this.tokens = tokens;
    this.log = log;
    this.clock = clock;
    this.outbox = outbox;
  }

  /** Sends `push` once per `idempotencyKey` and revokes the token of a device that is gone. */
  async send(push: OutboundPush, idempotencyKey: string): Promise<PushOutcome> {
    const known = await this.log.get(idempotencyKey);
    if (known !== undefined)
      return known === REVOKED ? { status: "revoked" } : { status: "sent", providerId: known };
    const delivery = {
      deliveryId: idempotencyKey,
      channel: NotificationChannel.Push,
      provider: push.target.kind === "expo" ? "expo" : "web-push",
    };
    let outcome: PushOutcome;
    try {
      outcome = push.target.kind === "expo" ? await this.sendExpo(push) : await this.sendWeb(push);
    } catch (error) {
      // A refusal is final; an outage is retried, so it records nothing.
      if (error instanceof ProviderRefusedError)
        await recordDelivery(this.outbox, this.clock, { ...delivery, status: "failed" });
      throw error;
    }
    await this.log.record(idempotencyKey, outcome.status === "sent" ? outcome.providerId : REVOKED);
    if (outcome.status === "revoked") await this.tokens.revoke(push.target);
    await recordDelivery(this.outbox, this.clock, { ...delivery, status: outcome.status });
    return outcome;
  }

  /**
   * Reads Expo receipts of earlier tickets and revokes each device they report gone.
   *
   * @returns the ticket ids whose push failed.
   */
  async receipts(
    ticketIds: readonly string[],
    targets: ReadonlyMap<string, string>,
  ): Promise<readonly string[]> {
    const answer = await this.expo.api.post<{
      readonly data: Readonly<Record<string, ExpoTicket>>;
    }>("/--/api/v2/push/getReceipts", { ids: ticketIds });
    const failed: string[] = [];
    for (const [id, receipt] of Object.entries(answer.data)) {
      if (receipt.status === "ok") continue;
      failed.push(id);
      const token = targets.get(id);
      if (receipt.details?.error === "DeviceNotRegistered" && token !== undefined)
        await this.tokens.revoke({ kind: "expo", token });
    }
    return failed;
  }

  /** One Expo push. */
  private async sendExpo(push: OutboundPush): Promise<PushOutcome> {
    if (push.target.kind !== "expo") throw new TypeError("not an Expo target");
    const answer = await this.expo.api.post<{ readonly data: readonly ExpoTicket[] }>(
      "/--/api/v2/push/send",
      [
        {
          to: push.target.token,
          title: push.title,
          body: push.body,
          data: push.data ?? {},
          ttl: push.ttlSeconds,
          ...(push.channelId === undefined ? {} : { channelId: push.channelId }),
        },
      ],
    );
    const ticket = answer.data[0];
    if (ticket?.status === "ok" && ticket.id !== undefined)
      return { status: "sent", providerId: ticket.id };
    if (ticket?.details?.error === "DeviceNotRegistered") return { status: "revoked" };
    throw ProviderRefusedError.create({
      provider: "expo",
      status: 200,
      ...(ticket?.details?.error === undefined ? {} : { code: ticket.details.error }),
    });
  }

  /** One Web Push. */
  private async sendWeb(push: OutboundPush): Promise<PushOutcome> {
    if (push.target.kind !== "web") throw new TypeError("not a Web Push target");
    const endpoint = new URL(push.target.endpoint);
    if (endpoint.protocol !== "https:") throw new TypeError("A Web Push endpoint must be https");
    const publicKey = this.secret("WEB_PUSH_VAPID_PUBLIC_KEY");
    const body = await encryptWebPush(
      JSON.stringify({ title: push.title, body: push.body, data: push.data ?? {} }),
      push.target,
    );
    const authorization = await vapidAuthorization({
      endpoint: push.target.endpoint,
      publicKey,
      privateKey: this.secret("WEB_PUSH_VAPID_PRIVATE_KEY"),
      subject: this.secret("WEB_PUSH_VAPID_SUBJECT"),
      now: this.clock.now(),
    });
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          authorization,
          "content-encoding": "aes128gcm",
          "content-type": "application/octet-stream",
          ttl: String(push.ttlSeconds),
        },
        body,
      });
    } catch (error) {
      throw ProviderUnavailableError.create({ provider: "web-push" }, { cause: error });
    }
    if (response.status === 404 || response.status === 410) return { status: "revoked" };
    if (response.status === 429 || response.status >= 500)
      throw ProviderUnavailableError.create({ provider: "web-push", status: response.status });
    if (!response.ok)
      throw ProviderRefusedError.create({ provider: "web-push", status: response.status });
    return { status: "sent", providerId: response.headers.get("location") ?? endpoint.origin };
  }

  /**
   * A VAPID secret by name.
   *
   * @throws TypeError naming the secret (never its value) when it is not set.
   */
  private secret(name: string): string {
    const value = this.secrets.get(name);
    if (value === undefined || value === "") throw new TypeError(`${name} is not set`);
    return value;
  }
}
