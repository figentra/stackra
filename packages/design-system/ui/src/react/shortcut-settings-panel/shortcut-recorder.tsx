/**
 * Stackra file contract:
 * Purpose: `ShortcutRecorder`, one action's row of the settings panel: its words and keys, a Change button that turns
 *          into a key recorder (the next key press, Escape to stop), the conflict warning for the recorded keys, and
 *          Save, Reset to the default and Remove.
 * Boundary: internal to `ShortcutSettingsPanel`. A reserved browser or system key cannot be saved; a clash with
 *           another action is a warning the person may override (the other action keeps its keys until changed).
 * Runtime: browser
 * Governing contract: ADR 0508 (remap with a key recorder and conflict warnings).
 */
import type { I18nKey } from "@stackra/i18n";
import type { RegisteredShortcut, ShortcutRegistryState } from "@stackra/shortcuts/react";
import { type KeyboardEvent, type ReactElement, useState } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { recordedShortcutStep } from "#core/functions/recorded-shortcut-step.function";
import { Alert } from "#react/alert/alert";
import { Button } from "#react/button/button";
import { useUiText } from "#react/hooks/use-ui-text";
import { ShortcutHint } from "#react/shortcut-hint/shortcut-hint";

/** K: the shortcut words. */
const K = UI_KEYS.ui.shortcuts;

/** The words of the standard bindings a clash may name when no registered action holds them. */
const STANDARD_WORDS: Readonly<Record<string, I18nKey>> = {
  "palette.open": UI_KEYS.ui.command_palette.label,
  "shortcuts.cheat_sheet": K.cheat_sheet,
  "ai.ask": K.ask_tamo,
  "form.submit": K.submit,
  "overlay.confirm": K.confirm,
  "overlay.close": K.close,
  "search.focus": K.focus_search,
  "filter.add": K.add_filter,
  "toast.undo": K.undo,
  "collection.select_all": K.select_all,
  "collection.edit": K.edit,
  "collection.preview": K.preview,
  "calendar.today": K.today,
  "calendar.previous": K.previous,
  "calendar.next": K.next,
  "media.previous": K.previous,
  "media.next": K.next,
  "pagination.previous": K.previous_page,
  "pagination.next": K.next_page,
  "copy.run": K.copy,
};

/** One remappable action. */
export function ShortcutRecorder({
  action,
  registry,
  isLocked,
  isRemapped,
  onSave,
}: {
  readonly action: RegisteredShortcut;
  readonly registry: Pick<ShortcutRegistryState, "conflictsOf" | "apple" | "actions">;
  readonly isLocked: boolean;
  readonly isRemapped: boolean;
  /** `undefined` resets to the default, `null` removes the binding. */
  readonly onSave: (keys: string | null | undefined) => void;
}): ReactElement {
  const t = useUiText();
  const [isRecording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState<string | undefined>();
  const conflicts = recorded === undefined ? [] : registry.conflictsOf(action.id, recorded);
  const reserved = conflicts.some((conflict) => conflict.kind === "reserved");
  const clash = conflicts.find((conflict) => conflict.kind !== "reserved");
  const other = clash?.shortcuts.find((id) => id !== action.id);
  const standard = other === undefined ? undefined : STANDARD_WORDS[other];
  const otherLabel =
    registry.actions.find((one) => one.id === other)?.label ??
    (standard === undefined ? other : t(standard));
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!isRecording) return;
    if (event.key === "Tab") return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key === "Escape" && !event.metaKey && !event.ctrlKey) {
      setRecording(false);
      return;
    }
    const step = recordedShortcutStep(event.nativeEvent, registry.apple);
    if (step !== undefined) {
      setRecorded(step);
      setRecording(false);
    }
  };
  const stop = () => {
    setRecorded(undefined);
    setRecording(false);
  };
  return (
    <li className="flex flex-col gap-2 border-b border-separator py-3 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm">{action.label}</span>
        <div className="flex items-center gap-2">
          {recorded === undefined ? (
            action.keys === undefined ? (
              <span className="text-xs text-muted">{t(K.not_set)}</span>
            ) : (
              <ShortcutHint keys={action.keys} />
            )
          ) : (
            <ShortcutHint keys={recorded} />
          )}
          <Button
            size="sm"
            variant={isRecording ? "primary" : "secondary"}
            isDisabled={isLocked}
            onPress={() => setRecording(!isRecording)}
            onKeyDown={onKeyDown}
            {...(isRecording ? { "data-shortcut-recording": true } : {})}
            aria-live="polite"
          >
            {isRecording ? t(K.recording) : t(K.change)}
          </Button>
          {isRemapped && recorded === undefined && !isLocked ? (
            <Button size="sm" variant="ghost" onPress={() => onSave(undefined)}>
              {t(K.reset)}
            </Button>
          ) : null}
          {action.keys !== undefined && recorded === undefined && !isLocked ? (
            <Button size="sm" variant="ghost" onPress={() => onSave(null)}>
              {t(K.unbind)}
            </Button>
          ) : null}
        </div>
      </div>
      {isRecording ? <p className="m-0 text-xs text-muted">{t(K.recording_help)}</p> : null}
      {reserved ? <Alert tone="danger" title={t(K.reserved)} /> : null}
      {clash !== undefined && !reserved ? (
        <Alert tone="warning" title={t(K.conflict, { action: otherLabel ?? "" })} />
      ) : null}
      {recorded !== undefined ? (
        <div className="flex gap-2">
          <Button
            size="sm"
            isDisabled={reserved}
            onPress={() => {
              onSave(recorded);
              stop();
            }}
          >
            {t(K.save)}
          </Button>
          <Button size="sm" variant="secondary" onPress={stop}>
            {t(K.cancel)}
          </Button>
        </div>
      ) : null}
    </li>
  );
}
