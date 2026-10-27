/**
 * Stackra file contract:
 * Purpose: unit tests of the `connection` transports (mail, SMS, WhatsApp): the provider comes from the resolver under
 *          the channel's capability with the driver map the host passed (the same object); a key already in the send
 *          log returns its id and sends nothing; a new send is logged; with an outbox a send records `sent` and a
 *          provider refusal `failed` as `DeliveryRecorded`, under the provider code of the map (stackra-207).
 * Boundary: test only; the resolver, the send log and the connection classes are in-memory stand-ins; the outbox is
 *           `OutboxFake`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0356 (decision 2); stackra-207 (STA-1360).
 */
import { Clock } from "@stackra/contracts";
import { OutboxFake } from "@stackra/events/testing";
import { ProviderRefusedError } from "@stackra/integrations";
import type { ProviderDrivers, ProviderResolver } from "@stackra/integrations";
import { describe, expect, it } from "@stackra/testing";

import { SendLog } from "#contracts/ports/send-log.port";
import type { MailSender } from "#contracts/types/mail-sender.type";
import type { SmsSender } from "#contracts/types/sms-sender.type";
import type { WhatsAppSender } from "#contracts/types/whatsapp-sender.type";
import { ConnectionMailTransportDriver } from "#core/drivers/connection-mail-transport.driver";
import { ConnectionSmsTransportDriver } from "#core/drivers/connection-sms-transport.driver";
import { ConnectionWhatsAppTransportDriver } from "#core/drivers/connection-whatsapp-transport.driver";

/** The host's maps; the vendor connection classes live in the OS integrations service, so these are stand-ins. */
const MAIL_CONNECTIONS = {} as ProviderDrivers<MailSender>;
const SMS_CONNECTIONS = {} as ProviderDrivers<SmsSender>;
const WHATSAPP_CONNECTIONS = {} as ProviderDrivers<WhatsAppSender>;

class MemorySendLog extends SendLog {
  readonly sent = new Map<string, string>();

  async get(key: string): Promise<string | undefined> {
    return this.sent.get(key);
  }

  async record(key: string, providerId: string): Promise<void> {
    this.sent.set(key, providerId);
  }
}

/** A resolver that records what it was asked and hands out `sender`. */
function resolverOf(sender: object) {
  const asked: [string, object][] = [];
  const resolver = {
    async resolve(capability: string, drivers: object) {
      asked.push([capability, drivers]);
      return sender;
    },
  } as unknown as ProviderResolver;
  return { resolver, asked };
}

describe("connection transports", () => {
  it("sends mail once per key through the resolved provider", async () => {
    let sends = 0;
    const { resolver, asked } = resolverOf({ sendMail: async () => `em_${(sends += 1)}` });
    const log = new MemorySendLog();
    const transport = new ConnectionMailTransportDriver(resolver, log, MAIL_CONNECTIONS);
    const mail = {
      to: "a@b.example",
      from: "o@acme.example",
      subject: "S",
      html: "<p/>",
      text: "",
    } as const;
    await expect(transport.send(mail, "k1")).resolves.toBe("em_1");
    await expect(transport.send(mail, "k1")).resolves.toBe("em_1");
    expect(sends).toBe(1);
    expect(asked).toEqual([["mail", MAIL_CONNECTIONS]]);
    expect(asked[0]?.[1]).toBe(MAIL_CONNECTIONS);
    expect(log.sent.get("k1")).toBe("em_1");
  });

  it("asks for sms and whatsapp with their driver maps", async () => {
    const sms = resolverOf({ sendSms: async () => "sm_1" });
    await new ConnectionSmsTransportDriver(sms.resolver, new MemorySendLog(), SMS_CONNECTIONS).send(
      { to: "+966500000001", from: "A", text: "t" },
      "k",
    );
    expect(sms.asked).toEqual([["sms", SMS_CONNECTIONS]]);
    expect(sms.asked[0]?.[1]).toBe(SMS_CONNECTIONS);
    const whatsapp = resolverOf({ sendWhatsApp: async () => "wa_1" });
    await expect(
      new ConnectionWhatsAppTransportDriver(
        whatsapp.resolver,
        new MemorySendLog(),
        WHATSAPP_CONNECTIONS,
      ).send({ to: "+966500000001", text: "t" }, "k"),
    ).resolves.toBe("wa_1");
    expect(whatsapp.asked).toEqual([["whatsapp", WHATSAPP_CONNECTIONS]]);
    expect(whatsapp.asked[0]?.[1]).toBe(WHATSAPP_CONNECTIONS);
  });

  it("records sent and refused deliveries under the map's provider code", async () => {
    class ResendStandIn {
      async sendMail(): Promise<string> {
        return "em_1";
      }
    }
    class TwilioStandIn {
      async sendSms(): Promise<string> {
        throw ProviderRefusedError.create({ provider: "twilio", status: 400 });
      }
    }
    const clock = new (class extends Clock {
      now(): Date {
        return new Date("2026-10-27T10:00:00Z");
      }
    })();
    const outbox = new OutboxFake();
    const mailDrivers = { resend: ResendStandIn } as unknown as ProviderDrivers<MailSender>;
    const smsDrivers = { twilio: TwilioStandIn } as unknown as ProviderDrivers<SmsSender>;
    const mail = new ConnectionMailTransportDriver(
      resolverOf(new ResendStandIn()).resolver,
      new MemorySendLog(),
      mailDrivers,
      outbox,
      clock,
    );
    await mail.send(
      { to: "a@b.example", from: "o@acme.example", subject: "S", html: "", text: "" },
      "k1",
    );
    await mail.send(
      { to: "a@b.example", from: "o@acme.example", subject: "S", html: "", text: "" },
      "k1",
    );
    const sms = new ConnectionSmsTransportDriver(
      resolverOf(new TwilioStandIn()).resolver,
      new MemorySendLog(),
      smsDrivers,
      outbox,
      clock,
    );
    await expect(sms.send({ to: "+966500000001", from: "A", text: "t" }, "k2")).rejects.toThrow(
      ProviderRefusedError,
    );
    const at = "2026-10-27T10:00:00.000Z";
    expect(outbox.take().map(({ event }) => event)).toEqual([
      expect.objectContaining({
        deliveryId: "k1",
        channel: "mail",
        provider: "resend",
        status: "sent",
        at,
      }),
      expect.objectContaining({
        deliveryId: "k2",
        channel: "sms",
        provider: "twilio",
        status: "failed",
        at,
      }),
    ]);
  });
});
