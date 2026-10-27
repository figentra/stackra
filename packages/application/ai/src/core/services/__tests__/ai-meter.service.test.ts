/**
 * Stackra file contract:
 * Purpose: unit tests of `AiMeter`: a call writes one `usage.recorded` on `ai.tokens` per direction in one outbox
 *          write, keyed `ai.tokens.input` and `ai.tokens.output`, with the model as subject and the reference, scope
 *          and actor in the envelope; a direction with no tokens writes nothing; a bad count is refused.
 * Boundary: test only; the outbox and the clock are in-test stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0216 (decision 2); STA-1377 (stackra-219).
 */
import { Clock, MeterKind } from "@stackra/contracts";
import { EventOutbox } from "@stackra/events/contracts";
import type { RecordedEvent } from "@stackra/events/contracts";
import { describe, expect, it } from "@stackra/testing";

import { AiMeter } from "#core/services/ai-meter.service";

const NOW = new Date("2026-10-28T10:00:00Z");

class FixedClock extends Clock {
  override now(): Date {
    return NOW;
  }
}

class Outbox extends EventOutbox {
  readonly writes: (readonly RecordedEvent[])[] = [];

  override async write(records: readonly RecordedEvent[]): Promise<void> {
    this.writes.push(records);
  }
}

describe("AiMeter", () => {
  it("meters input and output tokens per model and scope", async () => {
    const outbox = new Outbox();
    await new AiMeter(outbox, new FixedClock()).tokens(
      { inputTokens: 1200, outputTokens: 300 },
      { reference: "run_1", model: "bedrock/claude", scopeId: "org_1" },
    );
    expect(outbox.writes).toHaveLength(1);
    const [input, output] = outbox.writes[0] ?? [];
    expect(input?.event).toMatchObject({
      meter: "ai.tokens",
      kind: MeterKind.Sum,
      value: 1200,
      key: "ai.tokens.input",
      subject: "bedrock/claude",
      callId: "run_1",
      scopeId: "org_1",
    });
    expect(output?.event).toMatchObject({
      meter: "ai.tokens",
      value: 300,
      key: "ai.tokens.output",
    });
    expect(input?.meta).toMatchObject({
      occurredAt: NOW,
      scopeId: "org_1",
      correlationId: "run_1",
    });
    expect(input?.meta.id).toMatch(/^evt_[0-9a-hjkmnp-tv-z]{26}$/);
  });

  it("skips a direction with no tokens and writes nothing for none", async () => {
    const outbox = new Outbox();
    const meter = new AiMeter(outbox, new FixedClock());
    await meter.tokens(
      { inputTokens: 40, outputTokens: undefined },
      { reference: "d_1", model: "p/m" },
    );
    expect(outbox.writes[0]).toHaveLength(1);
    expect(outbox.writes[0]?.[0]?.meta.scopeId).toBeUndefined();
    await meter.tokens({}, { reference: "d_2", model: "p/m" });
    expect(outbox.writes).toHaveLength(1);
  });

  it("refuses a bad count", async () => {
    const meter = new AiMeter(new Outbox(), new FixedClock());
    await expect(
      meter.tokens({ inputTokens: -1 }, { reference: "d_3", model: "p/m" }),
    ).rejects.toThrow(RangeError);
  });
});
