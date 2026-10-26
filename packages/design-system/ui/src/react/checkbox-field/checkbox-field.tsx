/**
 * Stackra file contract:
 * Purpose: the web `CheckboxField`: the Checkbox a schema form binds by spreading `form.field(name)`, with its label as
 *          children (`<CheckboxField {...form.field("consent")}>I agree</CheckboxField>`), for a consent or terms box
 *          whose label is a sentence, a link included.
 * Boundary: thin: it draws the existing Checkbox, so the look, the error message and the accessibility are that
 *           component's; `children` is its `label`. Submitted natively under `name` while checked.
 * Runtime: browser
 * Governing contract: ADR 0055 (decision 2); ADR 0165 (decision 2: form adapters in @stackra/ui); ADR 0302
 *                     (decision 3).
 */
import type { ReactElement } from "react";

import { Checkbox } from "#react/checkbox/checkbox";
import type { CheckboxFieldProps } from "#react/checkbox-field/checkbox-field.props";

/** A checkbox whose label is its children, ready for a schema form's binding. */
export function CheckboxField({ children, ...rest }: CheckboxFieldProps): ReactElement {
  return <Checkbox {...rest} label={children} />;
}
