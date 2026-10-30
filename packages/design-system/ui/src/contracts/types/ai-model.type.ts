/**
 * Stackra file contract:
 * Purpose: `AiModel`, one model a `ModelPicker` offers: its id, name, provider, a short description, capability tags,
 *          context size, an optional new or beta badge and icon, and whether (and why) it cannot be picked.
 * Boundary: types only; the words are the app's, already in the reader's language.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { AiModelBadge } from "#contracts/enums/ai-model-badge.enum";
import type { IconSlot } from "#contracts/types/icon-slot.type";

/** One model of a model picker. */
export interface AiModel {
  /** The key the picker's value holds when this model is picked; unique within the list. */
  readonly id: string;
  /** The model's name, shown in the list and the trigger. */
  readonly name: string;
  /** The provider's name; the list is grouped by it, in the order providers first appear. */
  readonly provider: string;
  /** A short line on what the model is good at. */
  readonly description?: string | undefined;
  /** Capability tags, already in the reader's language, for example "Vision", "Fast", "Reasoning". */
  readonly capabilities?: readonly string[] | undefined;
  /** The context window in tokens, written compactly ("200K context"). */
  readonly contextWindow?: number | undefined;
  /** A "New" or "Beta" badge beside the name. */
  readonly badge?: AiModelBadge | undefined;
  /** The provider's or the model's icon: an icon name or any icon element. */
  readonly icon?: IconSlot;
  /** True to show the model but refuse it. */
  readonly isDisabled?: boolean | undefined;
  /** Why a disabled model cannot be picked, for example "On the Business plan". */
  readonly disabledReason?: string | undefined;
}
