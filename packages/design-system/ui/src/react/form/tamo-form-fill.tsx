/**
 * Stackra file contract:
 * Purpose: `TamoFormFill`, a form's "Fill from text" bar: the person pastes an email, a note or a signature, Tamo
 *          proposes a value per field (shown as label and value), Apply puts them in the form (dirty, validated) and
 *          marks each filled field for review; a status line counts them with Keep all and Undo.
 * Boundary: internal to `Form`. Without a field list it offers only the form's plain text inputs and text areas (never
 *           a password, email, phone, number, money or other numeric input, ADR 0507 decision 1); Tamo is told their
 *           names and labels, never their values. Undo puts back every value from before.
 * Runtime: browser
 * Governing contract: ADR 0507 (form fill from pasted text; filled fields marked for review); ADR 0021; WCAG 2.2 SC
 *          3.3.2, 4.1.3.
 */
import { useRef, useState, type ReactElement } from "react";
import { useLocale } from "react-aria-components";
import type { FieldPath, FieldPathValue, FieldValues } from "react-hook-form";

import type { TamoFieldHint } from "#contracts/types/tamo-field-hint.type";
import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { Button } from "#react/button/button";
import { useUiText } from "#react/hooks/use-ui-text";
import { TamoAskBox } from "#react/tamo-ask-box/tamo-ask-box";
import { TamoButton } from "#react/tamo-button/tamo-button";
import type { TamoFormFillProps } from "#react/form/tamo-form-fill.props";

/** K: the Tamo words. */
const K = TAMO_KEYS.ui.tamo;
/** The plain text boxes a fill may reach. */
const PLAIN =
  'input[name]:is([type="text"], :not([type])):not([inputmode="numeric"], [inputmode="decimal"], [inputmode="tel"]), textarea[name]';

/** The form's plain text fields, named by their labels. */
function plainFieldsOf(form: HTMLFormElement | null | undefined): TamoFieldHint[] {
  if (!form) return [];
  return [...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(PLAIN)].map((input) => ({
    id: input.name,
    label: input.labels?.[0]?.textContent?.trim() || input.getAttribute("aria-label") || input.name,
  }));
}

/** Fill a form from pasted text. */
export function TamoFormFill<T extends FieldValues = FieldValues>({
  slot,
  form,
  fields,
  onReview,
  pending,
}: TamoFormFillProps<T>): ReactElement {
  const t = useUiText();
  const { locale } = useLocale();
  const root = useRef<HTMLDivElement>(null);
  const [isAsking, setAsking] = useState(false);
  const [before, setBefore] = useState<Readonly<Record<string, unknown>>>({});
  const hints = () => fields ?? plainFieldsOf(root.current?.closest("form"));
  const set = (name: string, value: unknown) =>
    form.setValue(name as FieldPath<T>, value as FieldPathValue<T, FieldPath<T>>, {
      shouldDirty: true,
      shouldValidate: true,
    });

  return (
    <div ref={root} data-slot="tamo-form-fill" className="grid gap-2">
      {pending.length > 0 ? (
        <div
          role="status"
          className="flex flex-wrap items-center gap-2 rounded-[var(--radius-container)] bg-warning-soft px-3 py-2 text-sm text-warning-soft-foreground"
        >
          <span className="flex-1">{t(K.filled, { count: pending.length })}</span>
          <Button size="sm" variant="secondary" onPress={() => onReview([])}>
            {t(K.keep)}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => {
              for (const name of pending) set(name, before[name]);
              onReview([]);
            }}
          >
            {t(K.undo)}
          </Button>
        </div>
      ) : null}
      {isAsking ? (
        <div className="rounded-[var(--radius-container)] border border-separator bg-surface p-3">
          <TamoAskBox<Readonly<Record<string, string>>>
            label={t(K.fill_form)}
            placeholder={t(K.fill_form_placeholder)}
            isMultiline
            isAutoFocus
            onAsk={async (text, signal) => {
              const allowed = hints();
              const values = await slot.run("fill_form", { text, locale, fields: allowed }, signal);
              const known = new Set(allowed.map((field) => field.id));
              const kept = Object.fromEntries(
                Object.entries(values).filter(([name]) => known.has(name)),
              );
              return Object.keys(kept).length === 0 ? null : kept;
            }}
            renderProposal={(values) => (
              <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                {Object.entries(values).map(([name, value]) => (
                  <div key={name} className="contents">
                    <dt className="text-muted">
                      {hints().find((field) => field.id === name)?.label ?? name}
                    </dt>
                    <dd dir="auto" className="m-0 font-medium">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            onApply={(values) => {
              const names = Object.keys(values);
              const current = form.getValues() as Readonly<Record<string, unknown>>;
              setBefore(Object.fromEntries(names.map((name) => [name, current[name]])));
              for (const name of names) set(name, values[name]);
              onReview(names);
              setAsking(false);
            }}
            onDiscard={() => setAsking(false)}
          />
        </div>
      ) : (
        <div>
          <TamoButton label={t(K.fill_form)} size="sm" onPress={() => setAsking(true)} />
        </div>
      )}
    </div>
  );
}
