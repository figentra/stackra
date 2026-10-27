/**
 * Stackra file contract:
 * Purpose: unit tests of `SipVoiceGateway` on recorded carrier dialogues (RFC 3665 sections 3.1 and 3.6 shapes):
 *          an outbound call answers a 407 digest challenge, rings, is answered, ACKs, runs the host's instructions and
 *          hangs up by BYE, posting each status and metering its minutes; an incoming INVITE gets 100 Trying, the host's
 *          instructions, a 200 OK with the SDP answer, speaks over RTP after the ACK and ends by BYE; datagrams from
 *          another address are dropped; recording, unknown calls and bad webhook parameters are refused; `answer` and
 *          `event` round-trip.
 * Boundary: test only; the sockets, speech service, meter and host webhook are in-test fakes; the carrier side is a
 *           script of the messages a trunk sends, written from the RFC call flows, not captured from the carrier
 *           (certification pending, owner D3).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0376 (decision 7); RFC 3261; RFC 3665.
 */
import type { SecretStore } from "@stackra/config/contracts";
import type { Url } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CallStatus } from "#contracts/enums/call-status.enum";
import type { CallInstruction } from "#contracts/types/call-instruction.type";
import type { AudioDevice } from "#contracts/voice/audio-device.port";
import type { SpeechRequest } from "#contracts/voice/speech-request.type";
import { ProviderRefusedError } from "#core/errors/provider-refused.error";
import type { SpeechService } from "#core/voice/speech.service";
import type { VoiceMeter } from "#core/voice/voice-meter.service";
import { formatSip } from "#node/sip/format-sip.function";
import { parseSdp } from "#node/sip/parse-sdp.function";
import { parseSip } from "#node/sip/parse-sip.function";
import { rtpPayload } from "#node/sip/rtp-payload.function";
import { sipHeaders } from "#node/sip/sip-headers.function";
import type { SipMessage } from "#node/sip/sip-message.type";
import type { SipTrunkOptions } from "#node/sip/sip-trunk-options.type";
import { SipVoiceGateway } from "#node/sip/sip-voice-gateway.service";
import type { UdpPeer } from "#node/sip/udp-peer.type";
import type { UdpSocket } from "#node/sip/udp-socket.type";

const TRUNK = { address: "127.0.0.1", port: 5060 };

const INSTRUCTIONS = "https://host.test/voice/instructions" as Url;
const STATUS = "https://host.test/voice/status" as Url;
const INBOUND = "https://host.test/voice/inbound" as Url;

const OPTIONS: SipTrunkOptions = {
  host: "127.0.0.1",
  domain: "carrier.test",
  publicAddress: "203.0.113.7",
  codecs: ["alaw", "mulaw"],
  keepPlus: true,
  ringSeconds: 30,
  inbound: { instructionsUrl: INBOUND, statusUrl: STATUS },
};

const SECRETS: Readonly<Record<string, string>> = {
  SIP_TRUNK_USERNAME: "trunk",
  SIP_TRUNK_PASSWORD: "pw",
};

class FakeSocket implements UdpSocket {
  readonly sent: { text: string; data: Uint8Array; port: number; address: string }[] = [];

  closed = false;

  /** Answers each message sent with the datagrams the far end sends back. */
  far: ((message: SipMessage) => string[]) | undefined;

  private listener: ((data: Uint8Array, from: UdpPeer) => void) | undefined;

  private readonly port: number;

  constructor(port: number) {
    this.port = port;
  }

  send(data: Uint8Array, port: number, address: string): void {
    const text = new TextDecoder().decode(data);
    this.sent.push({ text, data, port, address });
    const answers = this.far?.(parseSip(text)) ?? [];
    for (const answer of answers) setTimeout(() => this.deliver(answer), 0);
  }

  on(_event: "message", listener: (data: Uint8Array, from: UdpPeer) => void): this {
    this.listener = listener;
    return this;
  }

  deliver(text: string, from: UdpPeer = TRUNK): void {
    this.listener?.(new TextEncoder().encode(text), from);
  }

  address(): UdpPeer {
    return { address: "0.0.0.0", port: this.port };
  }

  close(): void {
    this.closed = true;
  }

  /** The SIP messages sent, parsed. */
  messages(): SipMessage[] {
    return this.sent.map((sent) => parseSip(sent.text));
  }
}

/** A response to `request` as a carrier writes it. */
function reply(
  request: SipMessage,
  status: number,
  reason: string,
  extra: readonly (readonly [string, string])[] = [],
  body = "",
): string {
  const copied = new Set(["via", "from", "to", "call-id", "cseq"]);
  return formatSip({
    status,
    reason,
    headers: [...request.headers.filter(([name]) => copied.has(name.toLowerCase())), ...extra],
    body,
  });
}

/** `reply` with the carrier's To tag. */
function replyTagged(
  request: SipMessage,
  status: number,
  reason: string,
  extra: readonly (readonly [string, string])[] = [],
  body = "",
): string {
  const tagged: SipMessage = {
    ...request,
    headers: request.headers.map(([name, value]) =>
      name.toLowerCase() === "to"
        ? ([name, `${value};tag=314159`] as const)
        : ([name, value] as const),
    ),
  };
  return reply(tagged, status, reason, extra, body);
}

/** `value`, failing the test when it is missing. */
function defined<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("expected a value");
  return value;
}

const CARRIER_SDP = [
  "v=0",
  "o=carrier 1 1 IN IP4 192.0.2.10",
  "s=-",
  "c=IN IP4 192.0.2.10",
  "t=0 0",
  "m=audio 30000 RTP/AVP 8",
  "a=rtpmap:8 PCMA/8000",
  "",
].join("\r\n");

/** The host's fakes and what reached them. */
function hostOf(answers: Readonly<Record<string, readonly CallInstruction[]>>) {
  const signalling = new FakeSocket(5060);
  const rtp = new FakeSocket(40000);
  const posts: { url: string; params: Readonly<Record<string, string>> }[] = [];
  const metered: unknown[] = [];
  const said: string[] = [];
  const speech = {
    sayOn: async (device: AudioDevice, text: string, request: SpeechRequest) => {
      said.push(text);
      await device.play(
        (async function* () {
          yield new Uint8Array(160);
        })(),
        request.format,
      );
    },
  } as unknown as SpeechService;
  const meter = {
    call: async (call: unknown) => {
      metered.push(call);
    },
  } as unknown as VoiceMeter;
  let opened = 0;
  const gateway = new SipVoiceGateway(
    OPTIONS,
    { get: (name: string) => SECRETS[name] } as unknown as SecretStore,
    {
      speech,
      meter,
      session: (reference) => ({ drivers: {}, usage: { reference } }) as never,
      post: async (url, params) => {
        posts.push({ url, params });
        const steps = answers[url];
        return steps === undefined ? "" : gateway.answer(steps).body;
      },
      openUdp: async () => {
        opened += 1;
        return opened === 1 ? signalling : rtp;
      },
    },
  );
  return { gateway, signalling, rtp, posts, metered, said };
}

describe("SipVoiceGateway", () => {
  it("places a call through a digest challenge, runs its instructions and hangs up", async () => {
    const { gateway, signalling, posts, metered } = hostOf({
      [INSTRUCTIONS]: [{ kind: "hang_up" }],
    });
    signalling.far = (message) => {
      if (message.method === "INVITE" && sipHeaders(message, "Proxy-Authorization").length === 0)
        return [
          reply(message, 407, "Proxy Authentication Required", [
            ["Proxy-Authenticate", 'Digest realm="carrier.test", nonce="n1", qop="auth"'],
          ]),
        ];
      if (message.method === "INVITE")
        return [
          replyTagged(message, 180, "Ringing"),
          replyTagged(
            message,
            200,
            "OK",
            [
              ["Contact", "<sip:192.0.2.10:5060>"],
              ["Content-Type", "application/sdp"],
            ],
            CARRIER_SDP,
          ),
        ];
      if (message.method === "BYE") return [reply(message, 200, "OK")];
      return [];
    };

    const placed = await gateway.call({
      reference: "rem_1",
      to: "+966501234567",
      from: "+966112345678",
      instructionsUrl: INSTRUCTIONS,
      statusUrl: STATUS,
      record: false,
    });
    expect(placed.status).toBe(CallStatus.Queued);

    await vi.waitFor(async () => {
      expect((await gateway.lookup(placed.providerRef)).status).toBe(CallStatus.Completed);
      expect(signalling.sent).toHaveLength(5);
    });
    const sent = signalling.messages().map((message) => message.method);
    expect(sent).toEqual(["INVITE", "ACK", "INVITE", "ACK", "BYE"]);
    const [first, , second, ack, bye] = signalling.messages();
    expect(first?.uri).toBe("sip:+966501234567@carrier.test");
    expect(sipHeaders(defined(second), "Proxy-Authorization")[0]).toMatch(
      /^Digest username="trunk", realm="carrier.test", nonce="n1"/,
    );
    expect(sipHeaders(defined(second), "CSeq")[0]).toBe("2 INVITE");
    expect(ack?.uri).toBe("sip:192.0.2.10:5060");
    expect(sipHeaders(defined(bye), "To")[0]).toContain("tag=314159");
    expect(parseSdp(defined(first).body)).toMatchObject({
      address: "203.0.113.7",
      payloadTypes: [8, 0],
    });
    expect(posts.map((post) => [post.url, post.params.Status])).toEqual([
      [STATUS, CallStatus.Ringing],
      [STATUS, CallStatus.InProgress],
      [INSTRUCTIONS, CallStatus.InProgress],
      [STATUS, CallStatus.Completed],
    ]);
    expect(posts[2]?.params).toMatchObject({
      CallRef: placed.providerRef,
      Direction: "outbound",
      From: "+966112345678",
      To: "+966501234567",
    });
    expect(metered).toEqual([
      expect.objectContaining({ providerRef: placed.providerRef, status: CallStatus.Completed }),
    ]);
    gateway.stop();
  });

  it("ends a call the carrier refuses as busy", async () => {
    const { gateway, signalling, metered } = hostOf({});
    signalling.far = (message) =>
      message.method === "INVITE" ? [replyTagged(message, 486, "Busy Here")] : [];
    const placed = await gateway.call({
      reference: "rem_2",
      to: "+966501234567",
      from: "+966112345678",
      instructionsUrl: INSTRUCTIONS,
      record: false,
    });
    await vi.waitFor(async () =>
      expect((await gateway.lookup(placed.providerRef)).status).toBe(CallStatus.Busy),
    );
    expect(signalling.messages().map((message) => message.method)).toEqual(["INVITE", "ACK"]);
    expect(metered).toEqual([expect.objectContaining({ status: CallStatus.Busy })]);
    expect(metered[0]).not.toHaveProperty("durationSeconds");
    gateway.stop();
  });

  it("answers an incoming call, speaks over RTP and hangs up", async () => {
    const { gateway, signalling, rtp, posts, said } = hostOf({
      [INBOUND]: [
        { kind: "say", text: "marhaba", speech: { language: "ar-SA" } },
        { kind: "hang_up" },
      ],
    });
    await gateway.start();
    signalling.far = (message) => {
      if (message.status === 200 && sipHeaders(message, "CSeq")[0] === "1 INVITE")
        return [
          formatSip({
            method: "ACK",
            uri: "sip:203.0.113.7:5060",
            headers: [
              ["Via", "SIP/2.0/UDP 192.0.2.10:5060;branch=z9hG4bKack1"],
              ["From", "<sip:+966501234567@carrier.test>;tag=9fxced76sl"],
              ["To", sipHeaders(message, "To")[0] ?? ""],
              ["Call-ID", "in-1@192.0.2.10"],
              ["CSeq", "1 ACK"],
            ],
            body: "",
          }),
        ];
      if (message.method === "BYE") return [reply(message, 200, "OK")];
      return [];
    };
    signalling.deliver(
      formatSip({
        method: "INVITE",
        uri: "sip:+966112345678@203.0.113.7",
        headers: [
          ["Via", "SIP/2.0/UDP 192.0.2.10:5060;branch=z9hG4bKin1"],
          ["Max-Forwards", "70"],
          ["From", "<sip:966501234567@carrier.test>;tag=9fxced76sl"],
          ["To", "<sip:+966112345678@carrier.test>"],
          ["Call-ID", "in-1@192.0.2.10"],
          ["CSeq", "1 INVITE"],
          ["Contact", "<sip:192.0.2.10:5060>"],
          ["Content-Type", "application/sdp"],
        ],
        body: CARRIER_SDP.replace("RTP/AVP 8", "RTP/AVP 0 8"),
      }),
    );

    await vi.waitFor(async () => {
      expect((await gateway.lookup("in-1@192.0.2.10")).status).toBe(CallStatus.Completed);
      expect(signalling.sent).toHaveLength(3);
    });
    const sent = signalling.messages();
    expect(sent.map((message) => message.status ?? message.method)).toEqual([100, 200, "BYE"]);
    const ok = defined(sent[1]);
    expect(sipHeaders(ok, "To")[0]).toMatch(/;tag=\w+/);
    expect(parseSdp(ok.body)).toMatchObject({
      address: "203.0.113.7",
      port: 40000,
      payloadTypes: [0],
    });
    expect(sent[2]?.uri).toBe("sip:192.0.2.10:5060");
    expect(posts[0]).toMatchObject({
      url: INBOUND,
      params: { CallRef: "in-1@192.0.2.10", Direction: "inbound", From: "+966501234567" },
    });
    expect(said).toEqual(["marhaba"]);
    expect(rtp.sent).toHaveLength(1);
    expect(rtp.sent[0]).toMatchObject({ address: "192.0.2.10", port: 30000 });
    expect(rtpPayload(defined(rtp.sent[0]).data)?.payloadType).toBe(0);
    gateway.stop();
  });

  it("drops datagrams from anyone but the trunk", async () => {
    const { gateway, signalling } = hostOf({});
    await gateway.start();
    signalling.deliver("OPTIONS sip:x SIP/2.0\r\nCall-ID: a\r\nCSeq: 1 OPTIONS\r\n\r\n", {
      address: "198.51.100.9",
      port: 5060,
    });
    signalling.deliver("OPTIONS sip:x SIP/2.0\r\nCall-ID: a\r\nCSeq: 1 OPTIONS\r\n\r\n");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(signalling.messages().map((message) => message.status)).toEqual([200]);
    gateway.stop();
  });

  it("refuses recording and unknown calls", async () => {
    const { gateway } = hostOf({});
    await expect(gateway.record("x")).rejects.toSatisfy((error) =>
      ProviderRefusedError.is(error, { status: 501, code: "recording_unsupported" }),
    );
    await expect(
      gateway.call({
        reference: "r",
        to: "+1",
        from: "+2",
        instructionsUrl: INSTRUCTIONS,
        record: true,
      }),
    ).rejects.toSatisfy((error) => ProviderRefusedError.is(error, { status: 501 }));
    await expect(gateway.lookup("nope")).rejects.toSatisfy((error) =>
      ProviderRefusedError.is(error, { status: 404, code: "call_not_found" }),
    );
  });

  it("round-trips its webhook answer and parameters", () => {
    const { gateway } = hostOf({});
    const steps: CallInstruction[] = [{ kind: "hang_up" }];
    expect(gateway.answer(steps)).toEqual({
      contentType: "application/json",
      body: '{"instructions":[{"kind":"hang_up"}]}',
    });
    expect(
      gateway.event({
        CallRef: "c1",
        Direction: "inbound",
        From: "+966501234567",
        Status: "in_progress",
        SpeechResult: "ahlan",
        Confidence: "0.9",
      }),
    ).toEqual({
      providerRef: "c1",
      direction: "inbound",
      from: "+966501234567",
      status: CallStatus.InProgress,
      speech: { text: "ahlan", confidence: 0.9 },
    });
    expect(() => gateway.event({ Direction: "inbound", Status: "completed" })).toThrow(TypeError);
    expect(() => gateway.event({ CallRef: "c", Direction: "inbound", Status: "lost" })).toThrow(
      TypeError,
    );
  });
});
