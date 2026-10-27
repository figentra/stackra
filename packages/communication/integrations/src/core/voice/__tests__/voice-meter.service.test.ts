/**
 * Stackra file contract:
 * Purpose: unit tests of `VoiceMeter`: a finished call writes one `usage.recorded` on `voice.minutes` in minutes, a
 *          stream one on `speech.seconds`, each with the reference, scope and actor in the envelope; a call without a
 *          duration and a stream without audio write nothing.
 * Boundary: test only; the outbox and the clock are in-test stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0216 (decision 2); R3-SO-11.
 */
import { Clock, MeterKind } from "@stackra/contracts";
import { EventOutbox } from "@stackra/events/contracts";
import type { RecordedEvent } from "@stackra/events/contracts";
import { describe, expect, it } from "@stackra/testing";

import { CallStatus } from "#contracts/enums/call-status.enum";
import { VoiceMeter } from "#core/voice/voice-meter.service";

const NOW = new Date("2026-10-27T10:00:00Z");

class FixedClock extends Clock {
  now(): Date {
    return NOW;
  }
}

class Outbox extends EventOutbox {
  readonly written: RecordedEvent[] = [];

  async write(records: readonly RecordedEvent[]): Promise<void> {
    this.written.push(...records);
  }
}

describe("VoiceMeter", () => {
  it("meters a finished call's minutes", async () => {
    const outbox = new Outbox();
    await new VoiceMeter(outbox, new FixedClock()).call(
      { providerRef: "CA1", status: CallStatus.Completed, durationSeconds: 90 },
      { reference: "CA1", scopeId: "org_1" },
    );
    expect(outbox.written).toHaveLength(1);
    const [record] = outbox.written;
    expect(record?.event).toMatchObject({
      meter: "voice.minutes",
      kind: MeterKind.Sum,
      value: 1.5,
      key: "integrations.voice.call",
      callId: "CA1",
      scopeId: "org_1",
    });
    expect(record?.meta).toMatchObject({ occurredAt: NOW, scopeId: "org_1", correlationId: "CA1" });
    expect(record?.meta.id).toMatch(/^evt_[0-9a-hjkmnp-tv-z]{26}$/);
  });

  it("meters a stream's seconds", async () => {
    const outbox = new Outbox();
    await new VoiceMeter(outbox, new FixedClock()).speech(2.5, { reference: "lane_1" });
    expect(outbox.written[0]?.event).toMatchObject({
      meter: "speech.seconds",
      value: 2.5,
      callId: "lane_1",
    });
    expect(outbox.written[0]?.meta.scopeId).toBeUndefined();
  });

  it("writes nothing for no usage", async () => {
    const outbox = new Outbox();
    const meter = new VoiceMeter(outbox, new FixedClock());
    await meter.call({ providerRef: "CA2", status: CallStatus.NoAnswer }, { reference: "CA2" });
    await meter.call(
      { providerRef: "CA3", status: CallStatus.Completed, durationSeconds: 0 },
      { reference: "CA3" },
    );
    await meter.speech(0, { reference: "lane_2" });
    expect(outbox.written).toEqual([]);
  });
});
