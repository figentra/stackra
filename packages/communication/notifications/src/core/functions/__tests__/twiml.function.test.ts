/**
 * Stackra file contract:
 * Purpose: unit tests of `twiml`: each instruction's verb with its attributes, and XML escaping of text a caller or a
 *          template controls.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; PUT-216.
 */
import { describe, expect, it } from "@stackra/testing";

import { twiml } from "#core/functions/twiml.function";

describe("twiml", () => {
  it("renders each step", () => {
    expect(
      twiml([
        { kind: "say", text: "أهلا", speech: { language: "ar-AE", voice: "Polly.Hala" } },
        { kind: "play", url: "https://cdn.example/tone.mp3" },
        {
          kind: "listen",
          speech: { language: "ar-EG" },
          actionUrl: "https://os.example/voice/turn",
          timeoutSeconds: 5,
          hints: ["قص", "صبغة"],
        },
        { kind: "handover", to: "+971500000001", timeoutSeconds: 20 },
        { kind: "hang_up" },
      ]),
    ).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><Response>' +
        '<Say language="ar-AE" voice="Polly.Hala">أهلا</Say>' +
        "<Play>https://cdn.example/tone.mp3</Play>" +
        '<Gather input="speech" language="ar-EG" action="https://os.example/voice/turn" method="POST" timeout="5" speechTimeout="auto" hints="قص,صبغة"/>' +
        '<Dial timeout="20">+971500000001</Dial>' +
        "<Hangup/></Response>",
    );
  });

  it("escapes text", () => {
    expect(
      twiml([{ kind: "say", text: '<Redirect>x</Redirect> & "q"', speech: { language: "en" } }]),
    ).toContain("&lt;Redirect&gt;x&lt;/Redirect&gt; &amp; &quot;q&quot;");
  });
});
