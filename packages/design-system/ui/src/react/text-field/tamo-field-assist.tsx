/**
 * Stackra file contract:
 * Purpose: `TamoFieldAssist`, the Tamo layer of the web TextField and TextArea: an icon-only `TamoMenu` at the
 *          input's end that shows on hover or focus (and stays while working), the draft review under the field
 *          for a text action, the ask box for a first draft of an empty field, ghost text for "Continue writing",
 *          and, once a draft is accepted, the AI-made marker with Undo.
 * Boundary: internal to the two fields. It runs the slot's tasks and changes the field only on Accept, Apply or Tab
 *           (ADR 0021); Undo puts back the text from before. Typing drops the ghost and the Undo.
 * Runtime: browser
 * Governing contract: ADR 0507 (decisions 1, 2 and 6); WCAG 2.2 SC 1.4.13, 2.1.1, 4.1.3.
 */
import { cn } from "@heroui/react";
import { useState, type ReactElement } from "react";
import { useLocale } from "react-aria-components";

import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { Button } from "#react/button/button";
import { useTamoTask } from "#react/hooks/use-tamo-task";
import { useUiText } from "#react/hooks/use-ui-text";
import { TamoAskBox } from "#react/tamo-ask-box/tamo-ask-box";
import { TamoDraftReview } from "#react/tamo-draft-review/tamo-draft-review";
import { TamoGhostText } from "#react/tamo-ghost-text/tamo-ghost-text";
import { TamoMarker } from "#react/tamo-marker/tamo-marker";
import { TamoMenu } from "#react/tamo-menu/tamo-menu";
import { TamoStatusLine } from "#react/tamo-status-line/tamo-status-line";
import type { TamoFieldAssistProps } from "#react/text-field/tamo-field-assist.props";

/** What the assist is showing under the field. */
type Mode = "none" | "draft" | "review";

/** Tamo inside a text field or area. */
export function TamoFieldAssist({
  slot,
  field,
  value,
  onChange,
  isMultiline,
  children,
}: TamoFieldAssistProps): ReactElement {
  const t = useUiText();
  const { locale } = useLocale();
  const task = useTamoTask<string>();
  const [mode, setMode] = useState<Mode>("none");
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [ghost, setGhost] = useState("");
  const [undo, setUndo] = useState<string | null>(null);
  // "Continue writing" lands as ghost text, not a review, so it has a task of its own.
  const ghostTask = useTamoTask<string>();

  const choose = (action: string) => {
    setGhost("");
    if (action === "draft") {
      setMode("draft");
      return;
    }
    if (action === "continue") {
      setMode("none");
      ghostTask.run(async (signal) => {
        const next = await slot.run("continue", { text: value, locale, field }, signal);
        if (!signal.aborted) setGhost(next);
        return next;
      });
      return;
    }
    setMode("review");
    task.run((signal) => slot.run("transform", { text: value, action, locale, field }, signal));
  };
  const close = () => {
    task.reset();
    setMode("none");
  };
  const put = (next: string) => {
    setUndo(value);
    onChange(next);
    close();
  };
  const isShown =
    isMenuOpen || task.status !== "idle" || ghostTask.status === "working" || mode !== "none";

  return (
    <>
      <TamoGhostText
        value={value}
        suggestion={ghost}
        onAccept={(next) => {
          setGhost("");
          put(next);
        }}
        onDismiss={() => setGhost("")}
      >
        <div
          className="group/tamo-field relative"
          // Typing drops the ghost and the offer to undo: the text is the person's again.
          onInput={() => {
            setGhost("");
            setUndo(null);
          }}
        >
          {children}
          <div
            className={
              cn(
                "absolute end-1 flex transition-opacity motion-reduce:transition-none",
                isMultiline ? "top-1" : "inset-y-0 items-center",
                isShown
                  ? "opacity-100"
                  : "opacity-0 group-hover/tamo-field:opacity-100 group-focus-within/tamo-field:opacity-100",
              ) ?? ""
            }
          >
            <TamoMenu
              isIconOnly
              size="sm"
              text={value}
              hasContinue={isMultiline}
              actions={slot.actions}
              status={ghostTask.status === "working" ? "working" : "idle"}
              onAction={choose}
              onOpenChange={setMenuOpen}
            />
          </div>
        </div>
      </TamoGhostText>
      <TamoStatusLine status={ghostTask.status} onStop={ghostTask.stop} onRetry={ghostTask.retry} />
      {mode === "review" ? (
        <TamoDraftReview
          before={value}
          after={task.result ?? ""}
          status={task.status === "idle" ? "working" : task.status}
          onAccept={put}
          onDiscard={close}
          onStop={() => {
            task.stop();
            setMode("none");
          }}
          onRetry={task.retry}
        />
      ) : null}
      {mode === "draft" ? (
        <div className="rounded-[var(--radius-container)] border border-separator bg-surface p-3">
          <TamoAskBox<string>
            label={t(TAMO_KEYS.ui.tamo.draft)}
            placeholder={t(TAMO_KEYS.ui.tamo.draft_placeholder)}
            isAutoFocus
            onAsk={(prompt, signal) => slot.run("draft", { prompt, locale, field }, signal)}
            renderProposal={(draft) => (
              <p dir="auto" className="m-0 whitespace-pre-wrap text-sm">
                {draft}
              </p>
            )}
            onApply={put}
            onDiscard={close}
          />
        </div>
      ) : null}
      {undo !== null && mode === "none" ? (
        <div className="flex items-center gap-2">
          <TamoMarker />
          <Button
            size="sm"
            variant="ghost"
            onPress={() => {
              onChange(undo);
              setUndo(null);
            }}
          >
            {t(TAMO_KEYS.ui.tamo.undo)}
          </Button>
        </div>
      ) : null}
    </>
  );
}
