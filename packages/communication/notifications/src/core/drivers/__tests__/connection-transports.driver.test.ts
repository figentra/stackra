/**
 * Stackra file contract:
 * Purpose: unit tests of the `connection` transports (mail, SMS, WhatsApp): the provider comes from the resolver under
 *          the channel's capability with the channel's driver map; a key already in the send log returns its id and
 *          sends nothing; a new send is logged.
 * Boundary: test only; the resolver and the send log are in-memory stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0356 (decision 2).
 */
import type { ProviderResolver } from "@stackra/integrations";
import { describe, expect, it } from "@stackra/testing";

import { SendLog } from "#contracts/ports/send-log.port";
import { MAIL_CONNECTIONS } from "#core/constants/mail-connections.constant";
import { SMS_CONNECTIONS } from "#core/constants/sms-connections.constant";
import { WHATSAPP_CONNECTIONS } from "#core/constants/whatsapp-connections.constant";
import { ConnectionMailTransportDriver } from "#core/drivers/connection-mail-transport.driver";
import { ConnectionSmsTransportDriver } from "#core/drivers/connection-sms-transport.driver";
import { ConnectionWhatsAppTransportDriver } from "#core/drivers/connection-whatsapp-transport.driver";

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
    const transport = new ConnectionMailTransportDriver(resolver, log);
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
    expect(log.sent.get("k1")).toBe("em_1");
  });

  it("asks for sms and whatsapp with their driver maps", async () => {
    const sms = resolverOf({ sendSms: async () => "sm_1" });
    await new ConnectionSmsTransportDriver(sms.resolver, new MemorySendLog()).send(
      { to: "+966500000001", from: "A", text: "t" },
      "k",
    );
    expect(sms.asked).toEqual([["sms", SMS_CONNECTIONS]]);
    const whatsapp = resolverOf({ sendWhatsApp: async () => "wa_1" });
    await expect(
      new ConnectionWhatsAppTransportDriver(whatsapp.resolver, new MemorySendLog()).send(
        { to: "+966500000001", text: "t" },
        "k",
      ),
    ).resolves.toBe("wa_1");
    expect(whatsapp.asked).toEqual([["whatsapp", WHATSAPP_CONNECTIONS]]);
  });

  it("maps each provider code to a driver", () => {
    expect(Object.keys(MAIL_CONNECTIONS).sort()).toEqual(["resend", "ses"]);
    expect(Object.keys(SMS_CONNECTIONS).sort()).toEqual([
      "cequens",
      "taqnyat",
      "twilio",
      "unifonic",
    ]);
    expect(Object.keys(WHATSAPP_CONNECTIONS)).toEqual(["meta-whatsapp"]);
  });
});
