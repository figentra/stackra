/**
 * Stackra file contract:
 * Purpose: `renderSuggestionsPart`, the default renderer of a `data-tamo-suggestions` part: the follow-up prompts as
 *          @stackra/ui `PromptSuggestions`; picking one sends its text through the turn's `onSend`.
 * Boundary: pure over the part's data, read defensively: entries that are not text are skipped, and a part with none
 *           draws nothing. The suggestions refuse picking while the turn is being written or without `onSend`.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0507 (Ask Tamo); ADR 0165 (UI through @stackra/ui).
 */
import { PromptSuggestions } from "@stackra/ui/react";
import type { ReactNode } from "react";

import type { ChatPartOptions } from "#react/chat-surface/chat-part-options.type";

/**
 * A suggestions part as PromptSuggestions, or null when it has no text items.
 *
 * @example
 * renderSuggestionsPart({ items: ["Show last month"] }, part, { onSend, isWriting: false })
 */
export function renderSuggestionsPart(
  data: unknown,
  _part: unknown,
  options: ChatPartOptions,
): ReactNode {
  const items: unknown =
    typeof data === "object" && data !== null
      ? (data as { readonly items?: unknown }).items
      : undefined;
  const texts = Array.isArray(items)
    ? items.filter((item): item is string => typeof item === "string" && item !== "")
    : [];
  if (texts.length === 0) return null;
  const onSend = options.onSend;
  return (
    <PromptSuggestions
      suggestions={texts.map((text, index) => ({ id: String(index), title: text }))}
      onSelect={(suggestion) => onSend?.(suggestion.title)}
      isDisabled={options.isWriting || onSend === undefined}
    />
  );
}
