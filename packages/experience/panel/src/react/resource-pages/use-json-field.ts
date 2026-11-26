/**
 * Stackra file contract:
 * Purpose: `useJsonField(name)`, a JSON value form field edited as JSON text: the text, its change (valid text holds the
 *          parsed value, invalid text shows an error and fails the form), blur and the error state.
 * Boundary: platform-free: imports `react` and `@stackra/ui/form`'s binding and no UI kit; the web and native form fields
 *           spread the result on their own text area. The raw text never goes out.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (form keys are paths of the input); ADR 0055 (thin field adapters).
 */
import { useTranslation } from "@stackra/i18n/react";
import { useSchemaField } from "@stackra/ui/form";
import { useState, type ReactNode } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";

/**
 * The text area props of the JSON value at `name`.
 *
 * @example
 * <TextArea name="payload" label="Payload" rows={6} {...useJsonField("payload")} />
 */
export function useJsonField(name: string): {
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly onBlur: () => void;
  readonly isInvalid: boolean;
  readonly errorMessage: ReactNode;
} {
  const { t } = useTranslation();
  const field = useSchemaField<unknown>(name);
  const [text, setText] = useState(() =>
    field.value === undefined ? "" : JSON.stringify(field.value, null, 2),
  );
  const [isBroken, setBroken] = useState(false);
  const onChange = (next: string) => {
    setText(next);
    setBroken(false);
    if (next.trim() === "") return field.onChange?.(undefined);
    try {
      field.onChange?.(JSON.parse(next));
    } catch {
      setBroken(true);
      // NaN is no JSON value, so the schema refuses the submit until the text parses; the raw text never goes out.
      field.onChange?.(Number.NaN);
    }
  };
  return {
    value: text,
    onChange,
    onBlur: field.onBlur,
    isInvalid: isBroken || field.isInvalid === true,
    errorMessage: isBroken ? t(PANEL_KEYS.panel.resources.invalid_json) : field.errorMessage,
  };
}
