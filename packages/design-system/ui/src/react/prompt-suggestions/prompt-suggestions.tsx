/**
 * Stackra file contract:
 * Purpose: the web `PromptSuggestions`: suggested prompts as cards (an icon, a title and a muted line) or, without a
 *          line, as compact pills; choosing one calls `onSelect` with it. They wrap onto more lines or keep one line
 *          that scrolls sideways.
 * Boundary: a named list of React Aria buttons, so each is reached with Tab and chosen with Enter or Space; the set
 *           scrolls in the reading direction in Arabic.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.1.1, 4.1.2; STA-1371 (wave D, owner approval 2026-10-30).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";
import { Button as AriaButton } from "react-aria-components";

import { AI_CHAT_KEYS } from "#core/constants/ai-chat-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { PromptSuggestionsProps } from "#react/prompt-suggestions/prompt-suggestions.props";
import { SlotIcon } from "#react/slot-icon/slot-icon";

/** Suggested prompts to start or continue a conversation. */
export function PromptSuggestions({
  suggestions,
  onSelect,
  layout = "wrap",
  label,
  isDisabled = false,
  className,
}: PromptSuggestionsProps): ReactElement {
  const t = useUiText();
  const isScrolling = layout === "scroll";
  return (
    <ul
      aria-label={label ?? t(AI_CHAT_KEYS.ui.prompt_suggestions.label)}
      className={
        cn("flex gap-2", isScrolling ? "snap-x overflow-x-auto p-1" : "flex-wrap", className) ?? ""
      }
    >
      {suggestions.map((suggestion) => (
        <li key={suggestion.id} className={cn("flex", isScrolling && "shrink-0 snap-start") ?? ""}>
          <AriaButton
            isDisabled={isDisabled}
            onPress={() => onSelect(suggestion)}
            style={{
              borderRadius: suggestion.description
                ? "var(--radius-container)"
                : "var(--radius-pill)",
            }}
            className={({ isFocusVisible, isHovered, isPressed }) =>
              cn(
                "flex items-start gap-2 border border-border bg-surface text-start text-foreground outline-none transition-colors motion-reduce:transition-none disabled:opacity-(--disabled-opacity)",
                suggestion.description ? "max-w-64 px-3 py-2.5" : "px-3 py-1.5",
                (isHovered || isPressed) && "bg-default",
                isFocusVisible && "outline-2 outline-offset-2 outline-focus",
              ) ?? ""
            }
          >
            {suggestion.icon ? (
              <span className="mt-0.5 inline-flex shrink-0 text-muted">
                <SlotIcon icon={suggestion.icon} />
              </span>
            ) : null}
            <span className="grid gap-0.5">
              <span className="text-sm font-medium">{suggestion.title}</span>
              {suggestion.description ? (
                <span className="text-xs text-muted">{suggestion.description}</span>
              ) : null}
            </span>
          </AriaButton>
        </li>
      ))}
    </ul>
  );
}
