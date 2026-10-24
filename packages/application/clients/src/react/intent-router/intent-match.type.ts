/**
 * Stackra file contract:
 * Purpose: `IntentMatch`, the action call `useIntentRouter` proposes for free text: the action, the input known so far,
 *          the label and the risk to show, and the icon.
 * Boundary: a type only. A proposal is never run by itself: the palette shows it and the action runner runs it on the
 *           user's confirm, through the action's declared confirmation. The input is empty when the text only matched
 *           a phrase; the action's form asks for the rest. `risk` is text until `@stackra/iam` ships `Risk`.
 * Runtime: browser, react-native
 * Governing contract: ADR 0155 (intents); ADR 0139 (confirmation by risk).
 */
import type { I18nKey } from "@stackra/i18n";

import type { ActionRef } from "#core/types/action-ref.type";

/** A proposed action call. */
export interface IntentMatch {
  /** The proposed action. */
  readonly action: ActionRef;

  /** The input taken from the text; empty when none was. */
  readonly input: Readonly<Record<string, unknown>>;

  /** The action's label: the producer's permission label (`catalogue::permissions.product.archive`). */
  readonly label: I18nKey;

  /** The action's risk code (`l2`), when its ref declares one. */
  readonly risk?: string;

  /** The icon name the intent table gives. */
  readonly icon: string;
}
