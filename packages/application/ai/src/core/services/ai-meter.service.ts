/**
 * Stackra file contract:
 * Purpose: `AiMeter`, which writes the token usage of model calls: one `usage.recorded` event on `ai.tokens` for the
 *          input tokens and one for the output tokens of a call or run, each carrying the model (as the subject) and
 *          the scope, through the outbox, so `@stackra/entitlements` limits can cap AI spend.
 * Boundary: a service over the `EventOutbox` and the `Clock`, mirroring `VoiceMeter` of `@stackra/integrations`. It
 *           writes the existing `usage.recorded` event of `@stackra/actions` (`sum` meter, exact tokens), the one
 *           runtime import this package takes from actions. The direction is the event key and the model the
 *           `subject`, so the usage service can roll up per model while a limit on `ai.tokens` caps the total. Prices
 *           are rate-card data. A direction with no tokens writes nothing. The outbox write joins the caller's unit of
 *           work when there is one. Not called by `AgentRuntime` yet: the service that runs the agent calls it with
 *           the run's usage.
 * Runtime: isomorphic
 * Governing contract: ADR 0216 (decisions 1, 2 and 4); ADR 0156 (enforcement: token budgets); STA-1377 (stackra-219).
 */
import { UsageRecorded } from "@stackra/actions";
import { type Clock, MeterKind } from "@stackra/contracts";
import { Service } from "@stackra/container";
import type { EventOutbox, RecordedEvent } from "@stackra/events/contracts";

import { AI_METERS } from "#core/constants/ai-meters.constant";
import type { AiUsage } from "#core/types/ai-usage.type";

/** Crockford base32: no I, L, O or U (the outbox refuses an event id without `evt_`). */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/**
 * Meters model tokens.
 *
 * @example
 * const { usage } = await generateText({ model, prompt });
 * await meter.tokens(usage, { reference: runId, model: "bedrock/anthropic.claude-sonnet", scopeId });
 */
export class AiMeter extends Service {
  /** Where usage events go. */
  private readonly outbox: EventOutbox;

  /** When they happened. */
  private readonly clock: Clock;

  /**
   * @param outbox - the host's event outbox.
   * @param clock - the container's clock.
   */
  constructor(outbox: EventOutbox, clock: Clock) {
    super();
    this.outbox = outbox;
    this.clock = clock;
  }

  /**
   * Meters a call's or run's input and output tokens (AI SDK's `usage`); nothing for a direction with none.
   *
   * @throws RangeError when a token count is negative or not finite.
   */
  async tokens(
    counts: {
      readonly inputTokens?: number | undefined;
      readonly outputTokens?: number | undefined;
    },
    usage: AiUsage,
  ): Promise<void> {
    const records = [
      [AI_METERS.input, counts.inputTokens ?? 0],
      [AI_METERS.output, counts.outputTokens ?? 0],
    ] as const;
    if (records.some(([, value]) => !Number.isFinite(value) || value < 0))
      throw new RangeError(`AiMeter.tokens: token counts must be finite and not negative`);
    const events = records
      .filter(([, value]) => value > 0)
      .map(([meter, value]) => this.record(meter.name, meter.key, value, usage));
    if (events.length > 0) await this.outbox.write(events);
  }

  /** One `usage.recorded` event with its envelope. */
  private record(meter: string, key: string, value: number, usage: AiUsage): RecordedEvent {
    const event = UsageRecorded.create({
      meter,
      kind: MeterKind.Sum,
      value,
      key,
      subject: usage.model,
      callId: usage.reference,
      ...(usage.scopeId === undefined ? {} : { scopeId: usage.scopeId }),
    });
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(26));
    return {
      event,
      meta: {
        // 256 is a multiple of 32, so `% 32` keeps every character equally likely.
        id: `evt_${Array.from(bytes, (byte) => ALPHABET[byte % 32]).join("")}`,
        occurredAt: this.clock.now(),
        ...(usage.scopeId === undefined ? {} : { scopeId: usage.scopeId }),
        ...(usage.actor === undefined ? {} : { actor: usage.actor }),
        correlationId: usage.reference,
      },
    };
  }
}
