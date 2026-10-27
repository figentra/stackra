/**
 * Stackra file contract:
 * Purpose: `VOICE_METERS`, the two usage meters of the voice channel: `voice.minutes` (connected call time) and
 *          `speech.seconds` (audio recognised or synthesised), each with the key its `usage.recorded` events carry.
 * Boundary: names only. Both meters are `sum` meters of exact units; the price per unit and any rounding (per started
 *           minute) are the plan catalogue's `rate-card:voice-minutes` data, never here (RV-51).
 * Runtime: isomorphic
 * Governing contract: ADR 0376 (decision 7); R3-SO-11; RV-51 (minutes priced); ADR 0216 (decisions 1 and 2).
 */

/**
 * The voice meters.
 *
 * @example
 * VOICE_METERS.voice.name; // "voice.minutes"
 */
export const VOICE_METERS = Object.freeze({
  /** Connected call minutes, metered once per finished call. */
  voice: Object.freeze({ name: "voice.minutes", key: "integrations.voice.call" }),
  /** Seconds of audio through the Speech port, metered once per stream. */
  speech: Object.freeze({ name: "speech.seconds", key: "integrations.speech.stream" }),
} as const);
