/**
 * Stackra file contract:
 * Purpose: the web `PromptInput`: the composer of a chat or agent screen. A text box that grows with its text up to a
 *          limit, an attachments row above it, a toolbar of the caller's actions, and one button that sends (`ready`,
 *          `error`), spins (`submitted`) or stops the reply (`streaming`); a muted footer line under it. Files dropped
 *          on it go to `onFilesDrop`.
 * Boundary: Enter sends and Shift+Enter adds a line; Enter is ignored while composing (an IME) and while a reply runs,
 *           when the text is also read-only. The box is a named textbox and the button is named for what a press
 *           does. The shell shows focus as a ring around the whole composer. Logical spacing, so it mirrors in Arabic.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.1.1, 2.4.7 and 4.1.2;
 *          STA-1371 (component gaps, owner approval 2026-10-31).
 */
import { cn } from "@heroui/react";
import { IconRegistryProvider } from "@stackra/icons/react";
import { useState, type DragEvent, type ReactElement } from "react";

import { AI_PARTS_KEYS } from "#core/constants/ai-parts-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import { PROMPT_INPUT_ICONS } from "#react/prompt-input/prompt-input-icons.constant";
import type { PromptInputProps } from "#react/prompt-input/prompt-input.props";

/** The composer's words. */
const K = AI_PARTS_KEYS.ui.prompt_input;

/** The composer of a chat. */
export function PromptInput({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSubmit,
  onStop,
  status = "ready",
  placeholder,
  label,
  isDisabled = false,
  attachments,
  startActions,
  endActions,
  footer,
  onFilesDrop,
  className,
}: PromptInputProps): ReactElement {
  const t = useUiText();
  const [own, setOwn] = useState(defaultValue);
  const [isDragging, setDragging] = useState(false);
  const value = valueProp ?? own;
  const isRunning = status === "submitted" || status === "streaming";
  const canSend = !isDisabled && !isRunning && value.trim() !== "";
  const change = (next: string) => {
    setOwn(next);
    onValueChange?.(next);
  };
  const send = () => {
    if (!canSend) return;
    onSubmit(value.trim());
    if (valueProp === undefined) setOwn("");
  };
  return (
    <div data-slot="prompt-input" className={cn("flex w-full flex-col gap-2", className) ?? ""}>
      <div
        data-dragging={isDragging || undefined}
        className={cn(
          "flex flex-col rounded-[var(--radius-container)] border border-border bg-surface shadow-field",
          "transition-colors duration-(--duration-fast) motion-reduce:transition-none",
          "focus-within:ring-2 focus-within:ring-focus",
          "data-[dragging]:border-dashed data-[dragging]:border-accent",
          isDisabled && "opacity-50",
        )}
        {...(onFilesDrop
          ? {
              onDragOver: (event: DragEvent) => {
                event.preventDefault();
                setDragging(true);
              },
              onDragLeave: () => setDragging(false),
              onDrop: (event: DragEvent) => {
                event.preventDefault();
                setDragging(false);
                if (event.dataTransfer.files.length > 0) onFilesDrop([...event.dataTransfer.files]);
              },
            }
          : {})}
      >
        {attachments ? <div className="flex flex-wrap gap-2 px-3 pt-3">{attachments}</div> : null}
        <textarea
          aria-label={label ?? t(K.label)}
          placeholder={placeholder ?? t(K.placeholder)}
          value={value}
          rows={1}
          disabled={isDisabled}
          readOnly={isRunning}
          onChange={(event) => change(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
            event.preventDefault();
            send();
          }}
          className="block max-h-60 min-h-14 w-full resize-none bg-transparent px-3 pt-3 pb-2 text-sm leading-relaxed text-foreground outline-none [field-sizing:content] placeholder:text-muted"
        />
        <div className="flex items-center gap-2 px-2 pb-2">
          <div className="flex min-w-0 flex-1 items-center gap-1">{startActions}</div>
          {endActions}
          <IconRegistryProvider registry={PROMPT_INPUT_ICONS}>
            {status === "streaming" ? (
              <IconButton
                icon="square"
                label={t(K.stop)}
                variant="primary"
                size="sm"
                className="rounded-[var(--radius-pill)]"
                {...(onStop ? { onPress: onStop } : {})}
              />
            ) : (
              <IconButton
                icon="arrow-up"
                label={t(K.send)}
                variant="primary"
                size="sm"
                className="rounded-[var(--radius-pill)]"
                isLoading={status === "submitted"}
                isDisabled={!canSend}
                onPress={send}
              />
            )}
          </IconRegistryProvider>
        </div>
      </div>
      {footer ? <p className="m-0 text-center text-xs text-muted">{footer}</p> : null}
    </div>
  );
}
