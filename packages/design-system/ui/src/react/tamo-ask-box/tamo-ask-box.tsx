/**
 * Stackra file contract:
 * Purpose: the web `TamoAskBox`: the "ask in words" box. The person writes (or pastes) what they want, Tamo works
 *          (shimmer, Stop), and the structured proposal is drawn under it with Apply and Discard; nothing found says
 *          so; an error offers Try again.
 * Boundary: the proposal is the caller's to draw and to apply (ADR 0021); the box holds only the words and the task.
 *           Enter sends a single-line box; a multi-line one sends with its button (or Cmd/Ctrl+Enter).
 * Runtime: browser
 * Governing contract: ADR 0507 (ask in words: natural language in, structured proposal out); WCAG 2.2 SC 2.1.1,
 *          3.3.2, 4.1.3.
 */
import { cn, Input, TextArea as HeroTextArea, TextField as HeroTextField } from "@heroui/react";
import { useState, type KeyboardEvent, type ReactElement } from "react";

import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { Button } from "#react/button/button";
import { useTamoTask } from "#react/hooks/use-tamo-task";
import { useUiText } from "#react/hooks/use-ui-text";
import { TamoButton } from "#react/tamo-button/tamo-button";
import { TamoStatusLine } from "#react/tamo-status-line/tamo-status-line";
import type { TamoAskBoxProps } from "#react/tamo-ask-box/tamo-ask-box.props";

/** K: the Tamo words. */
const K = TAMO_KEYS.ui.tamo;

/** Ask Tamo in words; review its proposal. */
export function TamoAskBox<TProposal>({
  onAsk,
  renderProposal,
  onApply,
  onDiscard,
  label,
  placeholder,
  isMultiline = false,
  isAutoFocus = false,
  className,
}: TamoAskBoxProps<TProposal>): ReactElement {
  const t = useUiText();
  const [text, setText] = useState("");
  const task = useTamoTask<TProposal | null>();
  const name = label ?? t(K.ask);
  const send = () => {
    const words = text.trim();
    if (words !== "") task.run((signal) => onAsk(words, signal));
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    if (!isMultiline || event.metaKey || event.ctrlKey) {
      event.preventDefault();
      send();
    }
  };
  const hint = placeholder ?? t(K.ask_placeholder);
  // The box opens where the person just asked for it (a popover, a field's draft), so it takes the focus.
  const focus = isAutoFocus ? { autoFocus: true } : {};
  return (
    <div data-slot="tamo-ask-box" className={cn("grid gap-3", className) ?? ""}>
      <div className={cn("flex gap-2", isMultiline ? "flex-col" : "items-center") ?? ""}>
        <div className="min-w-0 flex-1">
          <HeroTextField aria-label={name} value={text} onChange={setText} fullWidth>
            {isMultiline ? (
              <HeroTextArea rows={4} placeholder={hint} onKeyDown={onKeyDown} {...focus} />
            ) : (
              <Input placeholder={hint} onKeyDown={onKeyDown} {...focus} />
            )}
          </HeroTextField>
        </div>
        <TamoButton
          label={name}
          size="md"
          status={task.status}
          isDisabled={text.trim() === "" || task.status === "working"}
          onPress={send}
          className={isMultiline ? "self-end" : ""}
        />
      </div>
      <TamoStatusLine status={task.status} onStop={task.stop} onRetry={task.retry} />
      {task.status === "ready" && task.result === null ? (
        <p role="status" className="m-0 text-sm text-muted">
          {t(K.no_proposal)}
        </p>
      ) : null}
      {task.status === "ready" && task.result != null ? (
        <section
          aria-label={t(K.proposal)}
          className="grid gap-2 rounded-[var(--radius-container)] border border-dashed border-[var(--tamo-glow-mid)] p-3"
        >
          <span className="text-xs font-medium text-[var(--tamo-name)]">{t(K.proposal)}</span>
          {renderProposal(task.result)}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onPress={() => {
                if (task.result != null) onApply(task.result);
                task.reset();
                setText("");
              }}
            >
              {t(K.apply)}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={() => {
                task.reset();
                onDiscard?.();
              }}
            >
              {t(K.discard)}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
