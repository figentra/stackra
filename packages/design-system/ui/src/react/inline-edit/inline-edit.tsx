/**
 * Stackra file contract:
 * Purpose: the web `InlineEdit`: a read-only value that opens an editor in place when pressed (click, Enter or Space).
 *          The editor saves on its save button or Enter and cancels on its cancel button or Escape; `validate` can keep
 *          it open with an error. Read and edit modes cross-fade on one row of the same height, so nothing below moves,
 *          and a saved value flashes the success colour. Focus goes into the input on open and back to the value on
 *          close.
 * Boundary: the look is the TextField's and IconButton's; the read row takes the field radius and the theme's colours.
 *           Motion is skipped under prefers-reduced-motion. "Edit", "Save" and "Cancel" come from the `ui` catalogue.
 * Runtime: browser
 * Governing contract: gap inventory row 5 (owner decision 2026-10-28, "P1 + P2 core"); ADR 0302 (decision 3); ADR 0055
 *          (forms: one field contract); WCAG 2.2 SC 2.1.1, 2.4.3, 3.3.1, 4.1.2.
 */
import type { ReactElement } from "react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { Button as AriaButton } from "react-aria-components";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { IconButton } from "#react/icon-button/icon-button";
import type { InlineEditProps } from "#react/inline-edit/inline-edit.props";
import { Text } from "#react/text/text";
import { TextField } from "#react/text-field/text-field";

const FAST = motionTiming(STACKRA_THEME, "fast");
const REVEAL = motionTiming(STACKRA_THEME, "reveal");

/** The read row: the field's height and radius, so switching modes moves nothing. */
const READ_CLASS_NAME =
  "flex min-h-9 w-full items-center justify-between gap-2 px-3 text-start outline-none [border-radius:var(--field-radius)] hover:bg-default data-[focus-visible]:[outline-style:var(--focus-ring-style)] data-[focus-visible]:outline-(length:--focus-ring-width) data-[focus-visible]:outline-focus data-[disabled]:opacity-(--disabled-opacity)";

/** A value the user edits in place; `onChange` receives the text when it is saved. */
export function InlineEdit({
  label,
  description,
  errorMessage,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  value,
  defaultValue,
  onChange,
  name,
  validate,
  placeholder,
  editLabel,
  saveLabel,
  cancelLabel,
  className,
}: InlineEditProps): ReactElement {
  const t = useUiText();
  const ids = { label: useId(), edit: useId(), value: useId() };
  const [own, setOwn] = useState(defaultValue ?? "");
  const saved = value ?? own;
  // `null` is read mode; text is the draft being edited.
  const [draft, setDraft] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | undefined>();
  const [flashes, setFlashes] = useState(0);
  const readRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const isEditing = draft !== null;
  const shouldRefocus = useRef(false);
  const [, animate] = useAnimate();
  const isReduced = useReducedMotion() ?? false;

  // The user asked to edit, so focus follows into the input; the field passes no autoFocus to it.
  useEffect(() => {
    if (isEditing) rootRef.current?.querySelector("input")?.focus();
  }, [isEditing]);

  useEffect(() => {
    if (draft !== null || !shouldRefocus.current) return;
    shouldRefocus.current = false;
    readRef.current?.focus();
    if (flashes > 0 && !isReduced && readRef.current)
      void animate(
        readRef.current,
        {
          backgroundColor: [
            "color-mix(in oklab, var(--success) 24%, transparent)",
            "color-mix(in oklab, var(--success) 0%, transparent)",
          ],
        },
        { duration: REVEAL.durationMs / 500 },
      );
  }, [draft, flashes, isReduced, animate]);

  const close = () => {
    shouldRefocus.current = true;
    setProblem(undefined);
    setDraft(null);
  };
  const save = () => {
    if (draft === null) return;
    const message = validate?.(draft);
    if (message) return setProblem(message);
    if (draft !== saved) {
      if (value === undefined) setOwn(draft);
      onChange?.(draft);
      setFlashes((count) => count + 1);
    }
    close();
  };

  const fade = {
    initial: isReduced ? (false as const) : { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: FAST.durationMs / 1000 },
  };
  const labelText = typeof label === "string" ? label : undefined;

  return (
    <div
      ref={rootRef}
      data-slot="inline-edit"
      className={["grid gap-1", className].filter(Boolean).join(" ")}
    >
      {label == null ? null : (
        <Text id={ids.label} type="small" tone="muted">
          {label}
        </Text>
      )}
      <span id={ids.edit} hidden>
        {editLabel ?? t(UI_KEYS.ui.inline_edit.edit)}
      </span>
      {draft === null ? (
        <motion.div key="read" {...fade}>
          <AriaButton
            ref={readRef}
            className={READ_CLASS_NAME}
            // The value is in the name, not only the description: the name must contain the visible text (WCAG 2.5.3).
            aria-labelledby={
              label == null ? `${ids.edit} ${ids.value}` : `${ids.edit} ${ids.label} ${ids.value}`
            }
            isDisabled={Boolean(isDisabled)}
            onPress={() => (isReadOnly ? undefined : setDraft(saved))}
          >
            <span id={ids.value} className={saved === "" ? "truncate text-muted" : "truncate"}>
              {saved === "" ? placeholder : saved}
            </span>
            {isReadOnly ? null : <Icon name="pencil" size="sm" tone="muted" />}
          </AriaButton>
          {name ? <input type="hidden" name={name} value={saved} /> : null}
        </motion.div>
      ) : (
        <motion.div key="edit" {...fade} className="flex items-start gap-1">
          <TextField
            className="min-w-0 flex-1"
            {...(labelText ? { "aria-label": labelText } : { "aria-labelledby": ids.label })}
            value={draft}
            onChange={(next: string) => {
              setDraft(next);
              setProblem(undefined);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") save();
              if (event.key === "Escape") close();
            }}
            isInvalid={Boolean(problem) || Boolean(isInvalid)}
            {...((problem ?? errorMessage) ? { errorMessage: problem ?? errorMessage } : {})}
            {...(isRequired === undefined ? {} : { isRequired })}
            {...(placeholder === undefined ? {} : { placeholder })}
            {...(name === undefined ? {} : { name })}
          />
          <IconButton
            icon="check"
            variant="primary"
            size="sm"
            label={saveLabel ?? t(UI_KEYS.ui.inline_edit.save)}
            onPress={save}
          />
          <IconButton
            icon="x"
            variant="ghost"
            size="sm"
            label={cancelLabel ?? t(UI_KEYS.ui.inline_edit.cancel)}
            onPress={close}
          />
        </motion.div>
      )}
      {description == null ? null : (
        <Text type="small" tone="muted">
          {description}
        </Text>
      )}
    </div>
  );
}
