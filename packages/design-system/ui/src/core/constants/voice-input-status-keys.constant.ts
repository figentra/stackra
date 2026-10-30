/**
 * Stackra file contract:
 * Purpose: `VOICE_INPUT_STATUS_KEYS`, the catalogue key of the status line a VoiceInput shows and announces in each
 *          state.
 * Boundary: keys only; the words are in `assets/lang/<locale>/ui.json`.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { I18nKey } from "@stackra/i18n";

import type { VoiceInputState } from "#contracts/enums/voice-input-state.enum";
import { AI_ASSIST_KEYS } from "#core/constants/ai-assist-keys.constant";

const K = AI_ASSIST_KEYS.ui.voice_input;

/** The status line's key, by state. */
export const VOICE_INPUT_STATUS_KEYS: Readonly<Record<VoiceInputState, I18nKey>> = {
  idle: K.idle,
  requesting: K.requesting,
  listening: K.listening,
  processing: K.processing,
  denied: K.denied,
  error: K.error,
};
