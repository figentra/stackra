/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Form field: Each field is bound the same way; the state comes from the form:
 *          a required rule, an error set on the field, the form disabling it, and a valid value.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0055 (forms); ADR 0060 (light, dark, RTL); WCAG 2.2 SC 3.3.1 and 4.1.3.
 */
import { Form, FormField as UiFormField, TextField, useCatalogueText } from "@stackra/ui/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { MESSAGES } from "#src/constants/messages.constant";
import { FORM_FIELD_KEYS } from "#src/demos/free/form-field/form-field-keys.constant";

/** The demo's keys. */
const K = FORM_FIELD_KEYS.form_field;

/** The values of the states form. */
interface StateValues {
  required: string;
  invalid: string;
  disabled: string;
  valid: string;
}

/** The grid that lays fields out in columns that wrap. */
const GRID = "grid gap-4 sm:grid-cols-2";

/** One form that shows each state a bound field can be in. */
function StatesForm() {
  const t = useCatalogueText(MESSAGES.en);
  const form = useForm<StateValues>({
    defaultValues: { required: "", invalid: "A", disabled: t(K.kept), valid: t(K.ada) },
  });
  const { setError } = form;
  // The error a server or an earlier submit would have set, so the invalid state is on the page without a click.
  useEffect(() => {
    setError("invalid", { type: "manual", message: t(K.invalid_message) });
    // oxlint-disable-next-line react/exhaustive-effect-dependencies, react-hooks/exhaustive-deps -- sets the server error once on mount; t is a new function each render, so listing it would set the error again on every render
  }, [setError]);

  return (
    <Form aria-label={t(K.states_name)} validationBehavior="aria" className={GRID}>
      <UiFormField
        control={form.control}
        name="required"
        rules={{ required: t(K.email_required) }}
        render={(binding) => <TextField {...binding} label={t(K.required)} />}
      />
      <UiFormField
        control={form.control}
        name="invalid"
        render={(binding) => <TextField {...binding} label={t(K.invalid)} />}
      />
      <UiFormField
        control={form.control}
        name="disabled"
        disabled
        render={(binding) => <TextField {...binding} label={t(K.disabled)} />}
      />
      <UiFormField
        control={form.control}
        name="valid"
        render={(binding) => <TextField {...binding} label={t(K.valid)} />}
      />
    </Form>
  );
}

/** Form field: States. */
export default function States() {
  return <StatesForm />;
}
