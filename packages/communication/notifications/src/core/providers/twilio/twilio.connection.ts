/**
 * Stackra file contract:
 * Purpose: `TwilioConnection`, one Twilio account as an `SmsSender` and a `VoiceGateway`: texts, outbound calls that
 *          ask our instructions webhook what to do, live redirects (the handover to a human), recording, hang-up,
 *          lookups, TwiML answers and Twilio's webhook parameters as `CallEvent`s.
 * Boundary: every call goes through `this.api` as a form (Twilio's REST API). Twilio has no idempotency header for
 *           sends: the `connection` transport's send log keeps a retried SMS from sending twice. Webhook parameters
 *           reach `event` only after `@stackra/webhooks` checked Twilio's signature. Numbers are not logged.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1); ADR 0308 (rules 2, 13 and 15); ADR 0356 (decision 2); PUT-216.
 */
import { Secret } from "@stackra/config";
import type { Url } from "@stackra/contracts";
import { ConnectedAccount, Connection } from "@stackra/integrations";
import { CallStatus } from "@stackra/integrations/contracts";
import type {
  CallEvent,
  CallInstruction,
  OutboundCall,
  ProviderCall,
  VoiceGateway,
} from "@stackra/integrations/contracts";

import type { OutboundSms } from "#contracts/types/outbound-sms.type";
import type { SmsSender } from "#contracts/types/sms-sender.type";
import { twiml } from "#core/functions/twiml.function";
import type { TwilioIntegration } from "#core/providers/twilio/twilio.integration";

/** Twilio's call states as `CallStatus`. */
const STATUSES: Readonly<Record<string, CallStatus>> = {
  queued: CallStatus.Queued,
  initiated: CallStatus.Queued,
  ringing: CallStatus.Ringing,
  "in-progress": CallStatus.InProgress,
  completed: CallStatus.Completed,
  busy: CallStatus.Busy,
  "no-answer": CallStatus.NoAnswer,
  failed: CallStatus.Failed,
  canceled: CallStatus.Cancelled,
};

/** A Twilio call, the fields the driver reads. */
interface TwilioCall {
  readonly sid: string;
  readonly status: string;
  readonly duration?: string | null;
}

/**
 * A Twilio account.
 *
 * @example
 * const placed = await twilio.call({ reference, to, from, instructionsUrl, record: plan.record });
 */
export class TwilioConnection
  extends Connection<TwilioIntegration>
  implements SmsSender, VoiceGateway
{
  /** The account SID. */
  accountSid!: string;

  /** The account's auth token. */
  @Secret("TWILIO_TENANT_AUTH_TOKEN")
  authToken!: string;

  /** The account's path prefix. */
  private get base(): string {
    return `/Accounts/${this.accountSid}`;
  }

  async check(): Promise<ConnectedAccount> {
    const account = await this.api.get<{ readonly sid: string; readonly friendly_name?: string }>(
      `${this.base}.json`,
    );
    return ConnectedAccount.create({ id: account.sid });
  }

  async sendSms(sms: OutboundSms): Promise<string> {
    const sent = await this.api.post<{ readonly sid: string }>(
      `${this.base}/Messages.json`,
      { To: sms.to, From: sms.from, Body: sms.text },
      { form: true },
    );
    return sent.sid;
  }

  async call(call: OutboundCall): Promise<ProviderCall> {
    return this.callOf(
      await this.api.post<TwilioCall>(
        `${this.base}/Calls.json`,
        {
          To: call.to,
          From: call.from,
          Url: call.instructionsUrl,
          Method: "POST",
          Record: call.record,
          Timeout: call.timeoutSeconds,
          StatusCallback: call.statusUrl,
          StatusCallbackEvent:
            call.statusUrl === undefined
              ? undefined
              : ["initiated", "ringing", "answered", "completed"],
        },
        { form: true },
      ),
    );
  }

  async lookup(providerRef: string): Promise<ProviderCall> {
    return this.callOf(await this.api.get<TwilioCall>(`${this.base}/Calls/${providerRef}.json`));
  }

  async redirect(providerRef: string, instructions: readonly CallInstruction[]): Promise<void> {
    await this.api.post(
      `${this.base}/Calls/${providerRef}.json`,
      { Twiml: twiml(instructions) },
      { form: true },
    );
  }

  async record(providerRef: string): Promise<void> {
    await this.api.post(`${this.base}/Calls/${providerRef}/Recordings.json`, {}, { form: true });
  }

  async hangUp(providerRef: string): Promise<ProviderCall> {
    return this.callOf(
      await this.api.post<TwilioCall>(
        `${this.base}/Calls/${providerRef}.json`,
        { Status: "completed" },
        { form: true },
      ),
    );
  }

  answer(instructions: readonly CallInstruction[]): {
    readonly contentType: string;
    readonly body: string;
  } {
    return { contentType: "text/xml", body: twiml(instructions) };
  }

  event(params: Readonly<Record<string, string>>): CallEvent {
    const speech = params["SpeechResult"];
    const confidence = params["Confidence"];
    const recording = params["RecordingUrl"];
    return {
      providerRef: params["CallSid"] ?? "",
      direction: params["Direction"] === "inbound" ? "inbound" : "outbound",
      status: STATUSES[params["CallStatus"] ?? ""] ?? CallStatus.InProgress,
      ...(params["From"] === undefined ? {} : { from: params["From"] }),
      ...(params["To"] === undefined ? {} : { to: params["To"] }),
      ...(speech === undefined
        ? {}
        : {
            speech: {
              text: speech,
              ...(confidence === undefined ? {} : { confidence: Number(confidence) }),
            },
          }),
      ...(recording === undefined ? {} : { recordingUrl: recording as Url }),
    };
  }

  /** A Twilio call as a `ProviderCall`. */
  private callOf(call: TwilioCall): ProviderCall {
    return {
      providerRef: call.sid,
      status: STATUSES[call.status] ?? CallStatus.Queued,
      ...(call.duration == null ? {} : { durationSeconds: Number(call.duration) }),
    };
  }
}
