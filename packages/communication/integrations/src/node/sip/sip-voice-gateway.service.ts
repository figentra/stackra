/**
 * Stackra file contract:
 * Purpose: `SipVoiceGateway`, the `VoiceGateway` over a carrier SIP trunk (a licensed carrier that gives a trunk, not
 *          conversational steps): it places calls (INVITE with digest auth, ring timeout by CANCEL) and receives them
 *          (an INVITE from the trunk), registers when the trunk asks for it, and runs each call's `CallInstruction`s
 *          itself: `say` and `listen` through `SpeechService` over the call's RTP leg (`RtpAudioDeviceDriver`),
 *          `play` from a WAV in the call's codec, `handover` by REFER, `hang_up` by BYE. Instructions come from the
 *          host's own call webhooks (`SipCallHost#post`) in the format `answer` writes; status changes are posted to
 *          the status URL as `event` reads them, and an answered call's minutes are metered when it ends.
 * Boundary: a service a carrier's platform Connection delegates to (vendor Connections are OS connectors, R3-8); no
 *           carrier is named here, every value is `SipTrunkOptions`. UDP only, one process holds a call's state
 *           (calls do not survive a restart). Datagrams from any address but the trunk's are dropped. Numbers, audio
 *           and transcripts are never stored or logged. Built from RFC 3261, 3264, 3515, 3550, 4566 and 7616 with
 *           recorded-fixture tests; certification pending against the carrier (owner D3, 2026-10-27). Not served:
 *           recording (refused), TLS/TCP, SRTP, DTMF, session timers, a caller id on handover.
 * Runtime: node
 * Governing contract: ADR 0376 (decision 7); RV-51; R3-SO-11; RFC 3261; RFC 3264; RFC 3515; RFC 3550; RFC 7616.
 */
import { lookup as resolveHost } from "node:dns/promises";
import { createSocket } from "node:dgram";

import type { SecretStore } from "@stackra/config/contracts";
import { Service } from "@stackra/container";
import { Enum } from "@stackra/contracts";
import type { Url } from "@stackra/contracts";

import { CallStatus } from "#contracts/enums/call-status.enum";
import type { CallEvent } from "#contracts/types/call-event.type";
import type { CallInstruction } from "#contracts/types/call-instruction.type";
import type { OutboundCall } from "#contracts/types/outbound-call.type";
import type { ProviderCall } from "#contracts/types/provider-call.type";
import type { SpeechVoice } from "#contracts/types/speech-voice.type";
import type { VoiceGateway } from "#contracts/types/voice-gateway.type";
import type { AudioEncoding } from "#contracts/voice/audio-encoding.enum";
import type { Transcript } from "#contracts/voice/transcript.type";
import { ProviderRefusedError } from "#core/errors/provider-refused.error";
import { ProviderUnavailableError } from "#core/errors/provider-unavailable.error";
import type { SpeechSession } from "#core/voice/speech-session.type";
import { digestAuthorization } from "#node/sip/digest-authorization.function";
import { formatSip } from "#node/sip/format-sip.function";
import { parseSdp } from "#node/sip/parse-sdp.function";
import { parseSip } from "#node/sip/parse-sip.function";
import { RtpAudioDeviceDriver } from "#node/sip/rtp-audio-device.driver";
import { RTP_PAYLOAD_TYPES } from "#node/sip/rtp-payload-types.constant";
import type { SipCallHost } from "#node/sip/sip-call-host.type";
import { sipHeaders } from "#node/sip/sip-headers.function";
import type { SipMessage } from "#node/sip/sip-message.type";
import { SIP_TRUNK_SECRETS } from "#node/sip/sip-trunk-secrets.constant";
import type { SipTrunkOptions } from "#node/sip/sip-trunk-options.type";
import type { SdpAudio } from "#node/sip/sdp-audio.type";
import type { UdpPeer } from "#node/sip/udp-peer.type";
import type { UdpSocket } from "#node/sip/udp-socket.type";
import { sdpOffer } from "#node/sip/sdp-offer.function";
import { wavAudio } from "#node/sip/wav-audio.function";

/** RFC 3261 timer T1 (round-trip estimate) and T2 (retransmit cap), in milliseconds. */
const T1 = 500;
const T2 = 4000;

/** The provider code in refusals. */
const PROVIDER = "sip";

/** The steps a host may answer with. */
const KINDS = new Set(["say", "play", "listen", "handover", "hang_up"]);

/** Answered calls kept for `lookup` after they end. */
// shortcut: ended calls are kept in memory up to this count, oldest dropped; a call store is the upgrade.
const KEEP_ENDED = 1000;

/** One call: its SIP dialog, media and the run of its instructions. */
interface Dialog {
  readonly callId: string;
  readonly direction: "inbound" | "outbound";
  readonly from: string;
  readonly to: string;
  /** Our From (outbound) or To (inbound) header value, without the tag. */
  readonly local: string;
  /** The far end's header value, without the tag. */
  readonly remote: string;
  readonly localTag: string;
  remoteTag?: string;
  /** Where in-dialog requests go (the far Contact). */
  target: string;
  routes: string[];
  cseq: number;
  status: CallStatus;
  statusUrl?: Url;
  answeredAt?: number;
  endedAt?: number;
  session?: SpeechSession;
  rtp?: UdpSocket;
  sdp?: string;
  device?: RtpAudioDeviceDriver;
  invite?: SipMessage;
  run?: AbortController;
  /** Settles a REFER's outcome from its NOTIFY. */
  referred?: ((ok: boolean) => void) | undefined;
  /** Stops the 200 OK retransmission of an incoming INVITE. */
  acked?: (() => void) | undefined;
}

/**
 * Calls over a SIP trunk.
 *
 * @example
 * export class ShopSipVoiceGateway extends SipVoiceGateway {
 *   protected override readonly options = trunkOptions;
 *   protected override readonly host = callHost;
 * }
 * const sip = new ShopSipVoiceGateway(secrets);
 * await sip.start(); // listen for incoming calls, register
 * const placed = await sip.call(outbound);
 */
export abstract class SipVoiceGateway extends Service implements VoiceGateway {
  /** The trunk's configuration, declared by the host's subclass. */
  protected abstract readonly options: SipTrunkOptions;

  /** Speech, meter, sessions and the call webhook post, declared by the host's subclass. */
  protected abstract readonly host: SipCallHost;

  private readonly secrets: SecretStore;

  private readonly dialogs = new Map<string, Dialog>();

  /** Open client transactions by `<branch> <CSeq method>`. */
  private readonly pending = new Map<string, (response: SipMessage) => void>();

  private socket: UdpSocket | undefined;

  private started: Promise<void> | undefined;

  /** The trunk's resolved addresses: the only sources heard. */
  private trunk: string[] = [];

  private refresh: ReturnType<typeof setTimeout> | undefined;

  /**
   * @param secrets - where the digest credentials are read by name.
   */
  constructor(secrets: SecretStore) {
    super();
    this.secrets = secrets;
  }

  /**
   * Binds the signalling port, resolves the trunk and registers when the trunk asks for it; once.
   *
   * @throws ProviderRefusedError when the carrier refuses the registration.
   * @throws ProviderUnavailableError when it does not answer.
   */
  start(): Promise<void> {
    this.started ??= (async () => {
      this.trunk = (await resolveHost(this.options.host, { all: true })).map((a) => a.address);
      this.socket = await this.openUdp(this.options.localPort ?? 5060);
      this.socket.on("message", (data, from) => this.receive(data, from));
      if (this.options.register !== undefined) await this.register();
    })();
    return this.started;
  }

  /** Stops refreshing the registration, drops every call's media and closes the signalling socket. */
  stop(): void {
    clearTimeout(this.refresh);
    for (const dialog of this.dialogs.values()) {
      dialog.run?.abort();
      dialog.device?.close();
      if (dialog.device === undefined) dialog.rtp?.close();
    }
    this.socket?.close();
    this.socket = undefined;
    this.started = undefined;
  }

  /**
   * Places `call`; resolves as soon as it is queued, and posts its status changes to `call.statusUrl`.
   *
   * @throws ProviderRefusedError (501, `recording_unsupported`) when the call asks to be recorded.
   */
  async call(call: OutboundCall): Promise<ProviderCall> {
    if (call.record) throw recordingRefused();
    await this.start();
    const dialog: Dialog = {
      callId: `${token()}@${this.options.publicAddress}`,
      direction: "outbound",
      from: call.from,
      to: call.to,
      local: `<${this.uriOf(call.from)}>`,
      remote: `<${this.uriOf(call.to)}>`,
      localTag: token(),
      target: this.uriOf(call.to),
      routes: [],
      cseq: 0,
      status: CallStatus.Queued,
      ...(call.statusUrl === undefined ? {} : { statusUrl: call.statusUrl }),
    };
    this.keep(dialog);
    dialog.session = this.host.session(call.reference);
    void this.dial(dialog, call).catch(() => this.end(dialog, CallStatus.Failed));
    return this.snapshot(dialog);
  }

  /**
   * The call `providerRef` as it is now.
   *
   * @throws ProviderRefusedError (404, `call_not_found`) when this process holds no such call.
   */
  async lookup(providerRef: string): Promise<ProviderCall> {
    return this.snapshot(this.dialog(providerRef));
  }

  /**
   * Stops what the live call is doing and runs `instructions` instead.
   *
   * @throws ProviderRefusedError (404, `call_not_found`; 409, `call_not_live`) when the call is unknown or not answered.
   */
  async redirect(providerRef: string, instructions: readonly CallInstruction[]): Promise<void> {
    const dialog = this.dialog(providerRef);
    if (dialog.status !== CallStatus.InProgress)
      throw ProviderRefusedError.create({ provider: PROVIDER, status: 409, code: "call_not_live" });
    void this.run(dialog, instructions).catch(() => this.bye(dialog));
  }

  /**
   * Recording is not served over a bare trunk.
   *
   * @throws ProviderRefusedError (501, `recording_unsupported`) always.
   */
  async record(_providerRef: string): Promise<void> {
    throw recordingRefused();
  }

  /**
   * Ends the call `providerRef`: CANCEL while it rings, BYE once answered.
   *
   * @throws ProviderRefusedError (404, `call_not_found`) when this process holds no such call.
   */
  async hangUp(providerRef: string): Promise<ProviderCall> {
    const dialog = this.dialog(providerRef);
    await this.bye(dialog);
    return this.snapshot(dialog);
  }

  /** The answer the host's call webhook returns: the instructions as JSON. */
  answer(instructions: readonly CallInstruction[]): {
    readonly contentType: string;
    readonly body: string;
  } {
    return { contentType: "application/json", body: JSON.stringify({ instructions }) };
  }

  /**
   * The parameters this driver posts to a call webhook, as a `CallEvent`.
   *
   * @throws TypeError when the parameters have no call reference, direction or known status.
   */
  event(params: Readonly<Record<string, string>>): CallEvent {
    const { CallRef: providerRef, Direction: direction, Status: status } = params;
    if (providerRef === undefined || providerRef === "")
      throw new TypeError("the call event has no CallRef");
    if (direction !== "inbound" && direction !== "outbound")
      throw new TypeError("the call event has no direction");
    if (!Enum.values(CallStatus).includes(status as CallStatus))
      throw new TypeError("the call event has no known status");
    const confidence = Number(params.Confidence);
    return {
      providerRef,
      direction,
      status: status as CallStatus,
      ...(params.From === undefined ? {} : { from: params.From }),
      ...(params.To === undefined ? {} : { to: params.To }),
      ...(params.SpeechResult === undefined
        ? {}
        : {
            speech: {
              text: params.SpeechResult,
              ...(Number.isFinite(confidence) && params.Confidence !== "" ? { confidence } : {}),
            },
          }),
    };
  }

  /** Places the call, waits for the answer, then runs its instructions. */
  private async dial(dialog: Dialog, call: OutboundCall): Promise<void> {
    dialog.rtp = await this.openUdp(0);
    dialog.sdp = sdpOffer(
      this.options.publicAddress,
      dialog.rtp.address().port,
      this.options.codecs,
      Date.now(),
    );
    let invite = this.request(dialog, "INVITE", this.uriOf(dialog.to), [], dialog.sdp);
    dialog.invite = invite;
    const ringing = (response: SipMessage): void => {
      if (response.status === 180 || response.status === 183)
        void this.setStatus(dialog, CallStatus.Ringing);
    };
    const ring = setTimeout(
      () => void this.cancel(dialog, CallStatus.NoAnswer),
      (call.timeoutSeconds ?? this.options.ringSeconds) * 1000,
    );
    try {
      let response = await this.transact(invite, ringing);
      if (response.status === 401 || response.status === 407) {
        this.ackFailure(invite, response);
        invite = this.authorised(invite, response);
        dialog.invite = invite;
        dialog.cseq = cseqNumber(invite);
        response = await this.transact(invite, ringing);
      }
      if ((response.status ?? 500) >= 300) {
        this.ackFailure(invite, response);
        await this.end(dialog, failureStatus(response.status ?? 500));
        return;
      }
      clearTimeout(ring);
      this.confirm(dialog, response, invite);
      dialog.answeredAt = Date.now();
      const far = parseSdp(response.body);
      const encoding = this.options.codecs.find((codec) =>
        far.payloadTypes.includes(RTP_PAYLOAD_TYPES[codec]?.type ?? -1),
      );
      if (encoding === undefined) {
        await this.bye(dialog);
        return;
      }
      this.connect(dialog, { address: far.address, port: far.port }, encoding);
    } finally {
      clearTimeout(ring);
    }
    await this.setStatus(dialog, CallStatus.InProgress);
    await this.run(dialog, await this.instructions(call.instructionsUrl, dialog, {}));
  }

  /** Takes an incoming INVITE from the trunk. */
  private async incoming(invite: SipMessage, from: UdpPeer): Promise<void> {
    const callId = sipHeaders(invite, "Call-ID")[0] ?? "";
    const inbound = this.options.inbound;
    if (inbound === undefined) {
      this.respond(invite, from, 480, "Temporarily Unavailable");
      return;
    }
    let offer: SdpAudio;
    try {
      offer = parseSdp(invite.body);
    } catch {
      this.respond(invite, from, 488, "Not Acceptable Here");
      return;
    }
    const encoding = offer.payloadTypes
      .map((type) => this.options.codecs.find((codec) => RTP_PAYLOAD_TYPES[codec]?.type === type))
      .find((codec) => codec !== undefined);
    if (encoding === undefined) {
      this.respond(invite, from, 488, "Not Acceptable Here");
      return;
    }
    const fromHeader = sipHeaders(invite, "From")[0] ?? "";
    const toHeader = sipHeaders(invite, "To")[0] ?? "";
    const remoteTag = tagOf(fromHeader);
    const dialog: Dialog = {
      callId,
      direction: "inbound",
      from: numberOf(fromHeader),
      to: numberOf(toHeader),
      local: withoutTag(toHeader),
      remote: withoutTag(fromHeader),
      localTag: token(),
      ...(remoteTag === undefined ? {} : { remoteTag }),
      target: uriIn(sipHeaders(invite, "Contact")[0] ?? fromHeader),
      routes: sipHeaders(invite, "Record-Route"),
      cseq: 0,
      status: CallStatus.Ringing,
      invite,
      ...(inbound.statusUrl === undefined ? {} : { statusUrl: inbound.statusUrl }),
    };
    this.keep(dialog);
    this.respond(invite, from, 100, "Trying");
    try {
      dialog.session = this.host.session(callId);
      dialog.rtp = await this.openUdp(0);
      dialog.sdp = sdpOffer(
        this.options.publicAddress,
        dialog.rtp.address().port,
        [encoding],
        Date.now(),
      );
      const steps = await this.instructions(inbound.instructionsUrl, dialog, {});
      if (Enum.meta(CallStatus, dialog.status).final) return;
      this.connect(dialog, { address: offer.address, port: offer.port }, encoding);
      await this.answerInvite(dialog, invite, from);
      dialog.answeredAt = Date.now();
      await this.setStatus(dialog, CallStatus.InProgress);
      await this.run(dialog, steps);
    } catch {
      if (dialog.answeredAt === undefined) {
        this.respond(invite, from, 503, "Service Unavailable", dialog.localTag);
        await this.end(dialog, CallStatus.Failed);
      } else await this.bye(dialog);
    }
  }

  /** Sends 200 OK with our SDP until the ACK arrives (RFC 3261 section 13.3.1.4). */
  private answerInvite(dialog: Dialog, invite: SipMessage, from: UdpPeer): Promise<void> {
    const ok = (): void =>
      this.respond(
        invite,
        from,
        200,
        "OK",
        dialog.localTag,
        [
          ["Contact", `<${this.contactUri()}>`],
          ["Content-Type", "application/sdp"],
        ],
        dialog.sdp ?? "",
      );
    return new Promise<void>((resolve, reject) => {
      let wait = T1;
      let timer: ReturnType<typeof setTimeout>;
      const resend = (): void => {
        ok();
        timer = setTimeout(resend, wait);
        wait = Math.min(wait * 2, T2);
      };
      const deadline = setTimeout(() => {
        clearTimeout(timer);
        dialog.acked = undefined;
        reject(ProviderUnavailableError.create({ provider: PROVIDER }));
      }, 64 * T1);
      dialog.acked = () => {
        clearTimeout(timer);
        clearTimeout(deadline);
        dialog.acked = undefined;
        resolve();
      };
      resend();
    });
  }

  /** Runs `steps` on the call, replacing whatever ran before; hangs up when they run out. */
  private async run(dialog: Dialog, steps: readonly CallInstruction[]): Promise<void> {
    dialog.run?.abort();
    const run = new AbortController();
    dialog.run = run;
    const live = (): boolean => !run.signal.aborted && dialog.status === CallStatus.InProgress;
    for (const step of steps) {
      if (!live()) return;
      if (step.kind === "say") await this.say(dialog, step.text, step.speech, run.signal);
      else if (step.kind === "play") await this.play(dialog, step.url, run.signal);
      else if (step.kind === "listen") {
        const heard = await this.listen(dialog, step, run.signal);
        if (!live()) return;
        const params: Record<string, string> = { SpeechResult: heard?.text ?? "" };
        if (heard?.confidence !== undefined) params.Confidence = String(heard.confidence);
        // What the listen posts back replaces the rest of the steps, as on any provider.
        return this.run(dialog, await this.instructions(step.actionUrl, dialog, params));
      } else if (step.kind === "handover") {
        if (await this.handover(dialog, step.to, step.timeoutSeconds)) return;
      } else {
        await this.bye(dialog);
        return;
      }
    }
    if (live()) await this.bye(dialog);
  }

  /** Speaks `text` on the call. */
  private async say(
    dialog: Dialog,
    text: string,
    speech: SpeechVoice,
    signal: AbortSignal,
  ): Promise<void> {
    const device = dialog.device;
    if (device === undefined || dialog.session === undefined) return;
    await this.host.speech.sayOn(
      device,
      text,
      { speech, format: device.format, signal },
      dialog.session,
    );
  }

  /** Plays the WAV at `url`; a file that cannot be fetched or is not in the call's codec is skipped. */
  private async play(dialog: Dialog, url: Url, signal: AbortSignal): Promise<void> {
    const device = dialog.device;
    if (device === undefined) return;
    let audio: Uint8Array;
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) return;
      audio = wavAudio(new Uint8Array(await response.arrayBuffer()), device.format.encoding);
    } catch {
      // A missing or unplayable file must not drop the caller; the next step runs.
      return;
    }
    await device.play(once(audio), device.format);
  }

  /** Listens until a final transcript or `timeoutSeconds` of silence. */
  private async listen(
    dialog: Dialog,
    step: Extract<CallInstruction, { kind: "listen" }>,
    signal: AbortSignal,
  ): Promise<Transcript | undefined> {
    const device = dialog.device;
    if (device === undefined || dialog.session === undefined) return undefined;
    const stop = new AbortController();
    const abort = (): void => stop.abort();
    signal.addEventListener("abort", abort, { once: true });
    let timer = setTimeout(abort, step.timeoutSeconds * 1000);
    try {
      const heard = this.host.speech.listenOn(
        device,
        {
          speech: step.speech,
          format: device.format,
          signal: stop.signal,
          ...(step.hints === undefined ? {} : { hints: step.hints }),
        },
        dialog.session,
      );
      for await (const transcript of heard) {
        clearTimeout(timer);
        timer = setTimeout(abort, step.timeoutSeconds * 1000);
        if (transcript.final) return transcript;
      }
      return undefined;
    } finally {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      stop.abort();
    }
  }

  /** Blind transfer by REFER; true once the far end reports the human answered, then hangs up our leg. */
  private async handover(dialog: Dialog, to: string, timeoutSeconds: number): Promise<boolean> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const outcome = new Promise<boolean>((resolve) => {
      dialog.referred = resolve;
      timer = setTimeout(() => resolve(false), timeoutSeconds * 1000);
    });
    try {
      const refer = this.request(dialog, "REFER", dialog.target, [
        ["Refer-To", `<${this.uriOf(to)}>`],
        ["Referred-By", dialog.local],
      ]);
      const response = await this.transact(refer).catch(() => undefined);
      if (response === undefined || (response.status ?? 500) >= 300) return false;
      const ok = await outcome;
      if (ok) await this.bye(dialog);
      return ok;
    } finally {
      clearTimeout(timer);
      dialog.referred = undefined;
    }
  }

  /** Ends the call from our side: CANCEL before the answer, BYE after. */
  private async bye(dialog: Dialog): Promise<void> {
    if (Enum.meta(CallStatus, dialog.status).final) return;
    if (dialog.answeredAt === undefined && dialog.direction === "outbound") {
      await this.cancel(dialog, CallStatus.Cancelled);
      return;
    }
    if (dialog.answeredAt === undefined && dialog.invite !== undefined) {
      const source = {
        address: this.trunk[0] ?? this.options.host,
        port: this.options.port ?? 5060,
      };
      this.respond(dialog.invite, source, 487, "Request Terminated", dialog.localTag);
      await this.end(dialog, CallStatus.Cancelled);
      return;
    }
    const request = this.request(dialog, "BYE", dialog.target, []);
    await this.end(dialog, CallStatus.Completed);
    await this.transact(request).catch(() => undefined);
  }

  /** Cancels a ringing outbound INVITE (RFC 3261 section 9.1), ending the call as `status`. */
  private async cancel(dialog: Dialog, status: CallStatus): Promise<void> {
    const invite = dialog.invite;
    if (invite === undefined || dialog.answeredAt !== undefined) return;
    if (Enum.meta(CallStatus, dialog.status).final) return;
    const keep = new Set(["via", "from", "to", "call-id", "route", "max-forwards"]);
    const cancel: SipMessage = {
      method: "CANCEL",
      uri: invite.uri ?? "",
      headers: [
        ...invite.headers.filter(([name]) => keep.has(name.toLowerCase())),
        ["CSeq", `${cseqNumber(invite)} CANCEL`],
      ],
      body: "",
    };
    await this.end(dialog, status);
    await this.transact(cancel).catch(() => undefined);
  }

  /** Marks the call over: status, media, the status post and its metered minutes. */
  private async end(dialog: Dialog, status: CallStatus): Promise<void> {
    if (Enum.meta(CallStatus, dialog.status).final) return;
    dialog.endedAt = Date.now();
    dialog.run?.abort();
    dialog.acked?.();
    dialog.device?.close();
    if (dialog.device === undefined) dialog.rtp?.close();
    await this.setStatus(dialog, status);
    if (dialog.session !== undefined)
      await this.host.meter.call(this.snapshot(dialog), dialog.session.usage);
  }

  /** Sets and posts the call's status. */
  private async setStatus(dialog: Dialog, status: CallStatus): Promise<void> {
    if (Enum.meta(CallStatus, dialog.status).final || dialog.status === status) return;
    dialog.status = status;
    if (dialog.statusUrl === undefined) return;
    try {
      await this.host.post(dialog.statusUrl, this.params(dialog));
    } catch {
      // A status webhook that fails must not change the call; `lookup` still tells the state.
    }
  }

  /** Posts to a call webhook and reads the instructions it answers. */
  private async instructions(
    url: Url,
    dialog: Dialog,
    extra: Readonly<Record<string, string>>,
  ): Promise<readonly CallInstruction[]> {
    return instructionsOf(await this.host.post(url, { ...this.params(dialog), ...extra }));
  }

  /** The webhook parameters of the call, as `event` reads them. */
  private params(dialog: Dialog): Record<string, string> {
    return {
      CallRef: dialog.callId,
      Direction: dialog.direction,
      From: dialog.from,
      To: dialog.to,
      Status: dialog.status,
    };
  }

  /** The call as a `ProviderCall`. */
  private snapshot(dialog: Dialog): ProviderCall {
    const seconds =
      dialog.answeredAt === undefined || dialog.endedAt === undefined
        ? undefined
        : (dialog.endedAt - dialog.answeredAt) / 1000;
    return {
      providerRef: dialog.callId,
      status: dialog.status,
      ...(seconds === undefined ? {} : { durationSeconds: seconds }),
    };
  }

  /** The call `providerRef`, or a 404 refusal. */
  private dialog(providerRef: string): Dialog {
    const dialog = this.dialogs.get(providerRef);
    if (dialog === undefined)
      throw ProviderRefusedError.create({
        provider: PROVIDER,
        status: 404,
        code: "call_not_found",
      });
    return dialog;
  }

  /** Keeps `dialog`, dropping the oldest ended calls beyond `KEEP_ENDED`. */
  private keep(dialog: Dialog): void {
    this.dialogs.set(dialog.callId, dialog);
    if (this.dialogs.size <= KEEP_ENDED) return;
    for (const [id, old] of this.dialogs) {
      if (this.dialogs.size <= KEEP_ENDED) break;
      if (Enum.meta(CallStatus, old.status).final) this.dialogs.delete(id);
    }
  }

  /** Joins the call's RTP leg to the far end. */
  private connect(dialog: Dialog, far: UdpPeer, encoding: AudioEncoding): void {
    if (dialog.rtp === undefined) return;
    dialog.device = RtpAudioDeviceDriver.over(dialog.rtp, far, encoding);
  }

  /** Takes the dialog from a 2xx to our INVITE and ACKs it. */
  private confirm(dialog: Dialog, response: SipMessage, invite: SipMessage): void {
    const tag = tagOf(sipHeaders(response, "To")[0] ?? "");
    if (tag !== undefined) dialog.remoteTag = tag;
    const contact = sipHeaders(response, "Contact")[0];
    if (contact !== undefined) dialog.target = uriIn(contact);
    // oxlint-disable-next-line unicorn/no-array-reverse -- reverses an array built here, which nothing else holds; toReversed is ES2023 and the base lib is ES2022
    dialog.routes = [...sipHeaders(response, "Record-Route")].reverse();
    this.ack(dialog, cseqNumber(invite));
  }

  /** Sends the ACK of a 2xx (a new transaction, RFC 3261 section 13.2.2.4). */
  private ack(dialog: Dialog, cseq: number): void {
    const ack = this.request(dialog, "ACK", dialog.target, []);
    this.send({
      ...ack,
      headers: ack.headers.map(([name, value]) =>
        name === "CSeq" ? ([name, `${cseq} ACK`] as const) : ([name, value] as const),
      ),
    });
  }

  /** Sends the ACK of a non-2xx final response (same branch, RFC 3261 section 17.1.1.3). */
  private ackFailure(invite: SipMessage, response: SipMessage): void {
    const keep = new Set(["via", "from", "call-id", "route", "max-forwards"]);
    this.send({
      method: "ACK",
      uri: invite.uri ?? "",
      headers: [
        ...invite.headers.filter(([name]) => keep.has(name.toLowerCase())),
        ["To", sipHeaders(response, "To")[0] ?? ""],
        ["CSeq", `${cseqNumber(invite)} ACK`],
      ],
      body: "",
    });
  }

  /** `request` again with a new branch and CSeq and the digest answer to `challenge`'s response. */
  private authorised(request: SipMessage, challenge: SipMessage): SipMessage {
    const proxy = challenge.status === 407;
    const header = sipHeaders(challenge, proxy ? "Proxy-Authenticate" : "WWW-Authenticate")[0];
    if (header === undefined)
      throw ProviderRefusedError.create({ provider: PROVIDER, status: challenge.status ?? 401 });
    const method = request.method ?? "";
    const authorization = digestAuthorization(header, {
      method,
      uri: request.uri ?? "",
      username: this.secret(this.options.usernameSecret ?? SIP_TRUNK_SECRETS.username),
      password: this.secret(this.options.passwordSecret ?? SIP_TRUNK_SECRETS.password),
      cnonce: token(),
    });
    const cseq = cseqNumber(request) + 1;
    return {
      ...request,
      headers: [
        ...request.headers.map(([name, value]): readonly [string, string] => {
          if (name === "Via") return [name, this.via()];
          if (name === "CSeq") return [name, `${cseq} ${method}`];
          return [name, value];
        }),
        [proxy ? "Proxy-Authorization" : "Authorization", authorization],
      ],
    };
  }

  /** Registers the trunk and schedules the refresh. */
  private async register(): Promise<void> {
    const expires = this.options.register?.expiresSeconds ?? 0;
    const domain = this.options.domain ?? this.options.host;
    const aor = `<sip:${this.secret(this.options.usernameSecret ?? SIP_TRUNK_SECRETS.username)}@${domain}>`;
    let request: SipMessage = {
      method: "REGISTER",
      uri: `sip:${domain}`,
      headers: [
        ["Via", this.via()],
        ["Max-Forwards", "70"],
        ["From", `${aor};tag=${token()}`],
        ["To", aor],
        ["Call-ID", `${token()}@${this.options.publicAddress}`],
        ["CSeq", "1 REGISTER"],
        ["Contact", `<${this.contactUri()}>`],
        ["Expires", String(expires)],
      ],
      body: "",
    };
    let response = await this.transact(request);
    if (response.status === 401 || response.status === 407) {
      request = this.authorised(request, response);
      response = await this.transact(request);
    }
    if ((response.status ?? 500) >= 300)
      throw ProviderRefusedError.create({ provider: PROVIDER, status: response.status ?? 500 });
    clearTimeout(this.refresh);
    this.refresh = setTimeout(
      () => void this.register().catch(() => undefined),
      (expires * 1000) / 2,
    );
  }

  /** A new in-dialog (or dialog-forming) request of `dialog`. */
  private request(
    dialog: Dialog,
    method: string,
    uri: string,
    extra: readonly (readonly [string, string])[],
    body = "",
  ): SipMessage {
    dialog.cseq += 1;
    const local = `${dialog.local};tag=${dialog.localTag}`;
    const remote =
      dialog.remoteTag === undefined ? dialog.remote : `${dialog.remote};tag=${dialog.remoteTag}`;
    return {
      method,
      uri,
      headers: [
        ["Via", this.via()],
        ["Max-Forwards", "70"],
        ...dialog.routes.map((route): readonly [string, string] => ["Route", route]),
        ["From", local],
        ["To", remote],
        ["Call-ID", dialog.callId],
        ["CSeq", `${dialog.cseq} ${method}`],
        ["Contact", `<${this.contactUri()}>`],
        ...extra,
        ...(body === "" ? [] : [["Content-Type", "application/sdp"] as const]),
      ],
      body,
    };
  }

  /**
   * Sends `request` and resolves to its final response, retransmitting over UDP (RFC 3261 section 17.1).
   *
   * @throws ProviderUnavailableError when no final response comes in time.
   */
  private transact(
    request: SipMessage,
    provisional?: (response: SipMessage) => void,
  ): Promise<SipMessage> {
    const key = `${branchOf(request)} ${request.method ?? ""}`;
    const invite = request.method === "INVITE";
    return new Promise<SipMessage>((resolve, reject) => {
      let wait = T1;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const finish = (response?: SipMessage): void => {
        clearTimeout(timer);
        clearTimeout(deadline);
        this.pending.delete(key);
        if (response === undefined) reject(ProviderUnavailableError.create({ provider: PROVIDER }));
        else resolve(response);
      };
      let deadline = setTimeout(() => finish(), 64 * T1);
      const resend = (): void => {
        this.send(request);
        timer = setTimeout(resend, wait);
        wait = Math.min(wait * 2, T2);
      };
      this.pending.set(key, (response) => {
        if ((response.status ?? 0) >= 200) {
          finish(response);
          return;
        }
        clearTimeout(timer);
        // An INVITE may ring for as long as the call allows; the ring timeout CANCELs it.
        if (invite) {
          clearTimeout(deadline);
          deadline = setTimeout(() => finish(), 64 * T1 + this.options.ringSeconds * 1000);
        }
        provisional?.(response);
      });
      resend();
    });
  }

  /** Handles one datagram on the signalling port. */
  private receive(data: Uint8Array, from: UdpPeer): void {
    if (!this.trunk.includes(from.address)) return;
    let message: SipMessage;
    try {
      message = parseSip(new TextDecoder().decode(data));
    } catch {
      return;
    }
    if (message.method === undefined) {
      this.response(message);
      return;
    }
    void this.inbound(message, from).catch(() => undefined);
  }

  /** Routes a response to its transaction, or re-ACKs a retransmitted 2xx to our INVITE. */
  private response(response: SipMessage): void {
    const method = (sipHeaders(response, "CSeq")[0] ?? "").split(" ")[1] ?? "";
    const handler = this.pending.get(`${branchOf(response)} ${method}`);
    if (handler !== undefined) {
      handler(response);
      return;
    }
    const dialog = this.dialogs.get(sipHeaders(response, "Call-ID")[0] ?? "");
    if (method === "INVITE" && (response.status ?? 0) >= 200 && (response.status ?? 0) < 300) {
      if (dialog?.answeredAt !== undefined) this.ack(dialog, cseqNumber(response));
    }
  }

  /** Answers a request from the trunk. */
  private async inbound(request: SipMessage, from: UdpPeer): Promise<void> {
    const dialog = this.dialogs.get(sipHeaders(request, "Call-ID")[0] ?? "");
    const tag = dialog?.localTag;
    switch (request.method) {
      case "INVITE":
        if (dialog === undefined) return this.incoming(request, from);
        // A retransmitted INVITE of a call still being set up only hears that we are on it.
        if (dialog.answeredAt === undefined) {
          this.respond(request, from, 100, "Trying");
          return;
        }
        // A re-INVITE (session refresh, hold) keeps the media as it is.
        this.respond(
          request,
          from,
          200,
          "OK",
          tag,
          [
            ["Contact", `<${this.contactUri()}>`],
            ["Content-Type", "application/sdp"],
          ],
          dialog.sdp ?? "",
        );
        return;
      case "ACK":
        dialog?.acked?.();
        return;
      case "BYE":
        this.respond(
          request,
          from,
          dialog === undefined ? 481 : 200,
          dialog === undefined ? "Call Does Not Exist" : "OK",
          tag,
        );
        if (dialog !== undefined) await this.end(dialog, CallStatus.Completed);
        return;
      case "CANCEL":
        this.respond(
          request,
          from,
          dialog === undefined ? 481 : 200,
          dialog === undefined ? "Call Does Not Exist" : "OK",
          tag,
        );
        if (dialog?.invite !== undefined && dialog.answeredAt === undefined) {
          this.respond(dialog.invite, from, 487, "Request Terminated", tag);
          await this.end(dialog, CallStatus.Cancelled);
        }
        return;
      case "NOTIFY": {
        this.respond(request, from, 200, "OK", tag);
        const status = Number(/^SIP\/2\.0 (\d{3})/.exec(request.body)?.[1] ?? 0);
        if (status >= 200) dialog?.referred?.(status < 300);
        return;
      }
      case "OPTIONS":
        this.respond(request, from, 200, "OK", tag);
        return;
      default:
        this.respond(request, from, 405, "Method Not Allowed", tag, [
          ["Allow", "INVITE, ACK, BYE, CANCEL, NOTIFY, OPTIONS"],
        ]);
    }
  }

  /** Answers `request` with `status`, back to where it came from (RFC 3581 style). */
  private respond(
    request: SipMessage,
    to: UdpPeer,
    status: number,
    reason: string,
    tag?: string,
    extra: readonly (readonly [string, string])[] = [],
    body = "",
  ): void {
    const copied = new Set(["via", "from", "call-id", "cseq", "record-route"]);
    const toHeader = sipHeaders(request, "To")[0] ?? "";
    const taggedTo =
      tag === undefined || status === 100 || tagOf(toHeader) !== undefined
        ? toHeader
        : `${toHeader};tag=${tag}`;
    this.send(
      {
        status,
        reason,
        headers: [
          ...request.headers.filter(([name]) => copied.has(name.toLowerCase())),
          ["To", taggedTo],
          ...extra,
        ],
        body,
      },
      to,
    );
  }

  /** Sends `message` to the trunk, or to `to`. */
  private send(message: SipMessage, to?: UdpPeer): void {
    const address = to?.address ?? this.trunk[0] ?? this.options.host;
    const port = to?.port ?? this.options.port ?? 5060;
    this.socket?.send(new TextEncoder().encode(formatSip(message)), port, address);
  }

  /** A Via with a fresh branch. */
  private via(): string {
    return `SIP/2.0/UDP ${this.options.publicAddress}:${this.options.localPort ?? 5060};branch=z9hG4bK${token()};rport`;
  }

  /** Our Contact URI. */
  private contactUri(): string {
    return `sip:${this.options.publicAddress}:${this.options.localPort ?? 5060}`;
  }

  /** The trunk URI of an E.164 number, in the trunk's number format. */
  private uriOf(number: string): string {
    const user = this.options.keepPlus ? number : number.replace(/^\+/, "");
    return `sip:${user}@${this.options.domain ?? this.options.host}`;
  }

  /**
   * The secret `name`.
   *
   * @throws TypeError when it is not set.
   */
  private secret(name: string): string {
    const value = this.secrets.get(name);
    if (value === undefined || value === "")
      throw new TypeError(`the SIP trunk secret ${name} is not set`);
    return value;
  }

  /** A bound UDP socket from the host, or node:dgram. */
  private async openUdp(port: number): Promise<UdpSocket> {
    if (this.host.openUdp !== undefined) return this.host.openUdp(port);
    const socket = createSocket("udp4");
    await new Promise<void>((resolve, reject) => {
      socket.once("error", reject);
      socket.bind(port, () => {
        socket.off("error", reject);
        resolve();
      });
    });
    // An ICMP error on a datagram must not crash the process; SIP retransmission covers a lost packet.
    socket.on("error", () => undefined);
    return socket;
  }
}

/** The refusal of a recording. */
function recordingRefused(): ProviderRefusedError {
  return ProviderRefusedError.create({
    provider: PROVIDER,
    status: 501,
    code: "recording_unsupported",
  });
}

/** The call status of a final failure response. */
function failureStatus(status: number): CallStatus {
  if (status === 486 || status === 600) return CallStatus.Busy;
  if (status === 487) return CallStatus.Cancelled;
  if (status === 408 || status === 480) return CallStatus.NoAnswer;
  return CallStatus.Failed;
}

/**
 * The instructions in a call webhook's answer.
 *
 * @throws TypeError when the body is not `{ instructions: [...] }` of known steps.
 */
function instructionsOf(body: string): readonly CallInstruction[] {
  const parsed: unknown = JSON.parse(body);
  const steps = (parsed as { instructions?: unknown } | null)?.instructions;
  if (!Array.isArray(steps)) throw new TypeError("the call webhook answered no instructions");
  for (const step of steps)
    if (!KINDS.has((step as { kind?: unknown } | null)?.kind as string))
      throw new TypeError("the call webhook answered an unknown step");
  return steps as CallInstruction[];
}

/** The top Via's branch. */
function branchOf(message: SipMessage): string {
  return /;\s*branch=([^;,\s]+)/i.exec(sipHeaders(message, "Via")[0] ?? "")?.[1] ?? "";
}

/** The CSeq number. */
function cseqNumber(message: SipMessage): number {
  return Number.parseInt(sipHeaders(message, "CSeq")[0] ?? "0", 10);
}

/** A header value's tag parameter (after the `<URI>`, where URI parameters cannot be mistaken for it). */
function tagOf(value: string): string | undefined {
  return /;\s*tag=([^;\s]+)/i.exec(value.slice(value.lastIndexOf(">") + 1))?.[1];
}

/** A header value without its tag parameter. */
function withoutTag(value: string): string {
  const at = value.lastIndexOf(">") + 1;
  return value.slice(0, at) + value.slice(at).replace(/;\s*tag=[^;\s]+/i, "");
}

/** The URI in a name-addr or addr-spec. */
function uriIn(value: string): string {
  return /<([^>]+)>/.exec(value)?.[1] ?? value.split(";")[0]?.trim() ?? value;
}

/** The phone number in a From or To header: E.164 when the user part is international digits. */
function numberOf(value: string): string {
  const user = /^(?:sips?|tel):([^@;]+)/i.exec(uriIn(value))?.[1] ?? "";
  // A national number (leading 0) is kept as the carrier sent it; digits without `+` are read as international.
  return /^\d{8,15}$/.test(user) ? `+${user}` : user;
}

/** A random hex token for tags, branches and Call-IDs. */
function token(): string {
  return Array.from(globalThis.crypto.getRandomValues(new Uint8Array(8)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

/**
 * One chunk as a stream.
 *
 * @yields `chunk`.
 */
async function* once(chunk: Uint8Array): AsyncGenerator<Uint8Array> {
  yield chunk;
}
