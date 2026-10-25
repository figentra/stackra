/**
 * Stackra file contract:
 * Purpose: the web `TextAreaField`: the TextArea a schema form binds by spreading `form.field(name)`, which hands it
 *          the value, the change and blur handlers, the invalid state and its message, beside `TextField` and
 *          `CheckboxField` in a form written against the binding.
 * Boundary: thin: it draws the existing TextArea with every prop, so the look, the accessibility and the props
 *           vocabulary (`rows`, `maxLength`) are that component's. Submitted natively under `name`.
 * Runtime: browser
 * Governing contract: ADR 0055 (decision 2); ADR 0165 (decision 2: form adapters in @stackra/ui); ADR 0302
 *                     (decision 3).
 */
import type { ReactElement } from "react";

import { TextArea, type TextAreaProps } from "#react/text-area/text-area";

/** Props of the web TextAreaField: the TextArea's own. */
export type TextAreaFieldProps = TextAreaProps;

/** A multi-line text field ready for a schema form's binding. */
export function TextAreaField(props: TextAreaFieldProps): ReactElement {
  return <TextArea {...props} />;
}
