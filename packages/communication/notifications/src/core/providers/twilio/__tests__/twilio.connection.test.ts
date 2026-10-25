/**
 * Stackra file contract:
 * Purpose: unit tests of `TwilioConnection`: SMS as a form; an outbound call with its instructions URL, recording and
 *          status events; lookup and hang-up mapped to `CallStatus`; a redirect carrying TwiML; the TwiML answer; and
 *          webhook parameters normalised to a `CallEvent`.
 * Boundary: test only; the managed client is `fakeIntegrationApi`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0223 (decision 1); PUT-216.
 */
import { CallStatus } from "@stackra/integrations/contracts";
import { fakeIntegrationApi, makeConnection } from "@stackra/integrations/testing";
import type { FakeIntegrationRoutes } from "@stackra/integrations/testing";
import { describe, expect, it } from "@stackra/testing";

import { TwilioConnection } from "#core/providers/twilio/twilio.connection";
import { TwilioIntegration } from "#core/providers/twilio/twilio.integration";

const connect = (routes: (r: FakeIntegrationRoutes) => unknown) =>
  makeConnection(TwilioConnection, {
    api: fakeIntegrationApi(TwilioIntegration, routes),
    fields: { accountSid: "AC1", authToken: "token" },
  });

describe("TwilioConnection", () => {
  it("sends SMS as a form", async () => {
    let seen: { body?: unknown } = {};
    const twilio = connect((r) =>
      r
        .post("/Accounts/AC1/Messages.json")
        .returns((_p, request) => ((seen = request), { sid: "SM1" })),
    );
    await expect(twilio.sendSms({ to: "+966500000001", from: "ACME", text: "Hi" })).resolves.toBe(
      "SM1",
    );
    expect(seen.body).toEqual({ To: "+966500000001", From: "ACME", Body: "Hi" });
  });

  it("places, reads, redirects and ends calls", async () => {
    const bodies: unknown[] = [];
    const twilio = connect((r) =>
      r
        .post("/Accounts/AC1/Calls.json")
        .returns((_p, request) => (bodies.push(request.body), { sid: "CA1", status: "queued" }))
        .get("/Accounts/AC1/Calls/:sid")
        .returns(() => ({ sid: "CA1", status: "in-progress" }))
        .post("/Accounts/AC1/Calls/:sid")
        .returns(
          (_p, request) => (
            bodies.push(request.body),
            { sid: "CA1", status: "completed", duration: "42" }
          ),
        ),
    );
    await expect(
      twilio.call({
        reference: "apt_1",
        to: "+971500000001",
        from: "+971400000000",
        instructionsUrl: "https://os.example/voice/answer",
        statusUrl: "https://os.example/voice/status",
        record: true,
      }),
    ).resolves.toEqual({ providerRef: "CA1", status: CallStatus.Queued });
    expect(bodies[0]).toMatchObject({
      Url: "https://os.example/voice/answer",
      Record: true,
      Method: "POST",
    });
    await expect(twilio.lookup("CA1")).resolves.toMatchObject({ status: CallStatus.InProgress });
    await twilio.redirect("CA1", [{ kind: "handover", to: "+971500000002", timeoutSeconds: 20 }]);
    expect(String((bodies[1] as { Twiml: string }).Twiml)).toContain(
      '<Dial timeout="20">+971500000002</Dial>',
    );
    await expect(twilio.hangUp("CA1")).resolves.toEqual({
      providerRef: "CA1",
      status: CallStatus.Completed,
      durationSeconds: 42,
    });
  });

  it("answers with TwiML and normalises webhooks", () => {
    const twilio = connect(() => undefined);
    expect(twilio.answer([{ kind: "hang_up" }])).toEqual({
      contentType: "text/xml",
      body: '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>',
    });
    expect(
      twilio.event({
        CallSid: "CA1",
        Direction: "inbound",
        CallStatus: "in-progress",
        From: "+966500000001",
        To: "+966110000000",
        SpeechResult: "أبغى موعد",
        Confidence: "0.91",
      }),
    ).toEqual({
      providerRef: "CA1",
      direction: "inbound",
      status: CallStatus.InProgress,
      from: "+966500000001",
      to: "+966110000000",
      speech: { text: "أبغى موعد", confidence: 0.91 },
    });
  });
});
