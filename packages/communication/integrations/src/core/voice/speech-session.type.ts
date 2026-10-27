/**
 * Stackra file contract:
 * Purpose: `SpeechSession`, what `SpeechService` needs besides the audio for one stream: the caller's speech
 *          Connection classes by provider code, whom the stream's seconds are billed to, and whether only a provider
 *          that keeps nothing may serve it.
 * Boundary: a type only. `zeroRetention` is the caller's decision from the data class of what is said (health,
 *           privileged); in-region is already given by the region map.
 * Runtime: isomorphic
 * Governing contract: ADR 0376 (decision 7: in-region and without retention for the health and privileged classes);
 *                     R3-SO-11.
 */
import type { Speech } from "#contracts/voice/speech.type";
import type { ProviderDrivers } from "#core/types/provider-drivers.type";
import type { VoiceUsage } from "#core/voice/voice-usage.type";

/** One stream's provider choice and billing. */
export interface SpeechSession {
  /** The caller's speech Connection class per provider code. */
  readonly drivers: ProviderDrivers<Speech>;

  /** Whom the seconds are billed to. */
  readonly usage: VoiceUsage;

  /** Serve only from a provider whose `retainsAudio` is false. */
  readonly zeroRetention?: boolean;
}
