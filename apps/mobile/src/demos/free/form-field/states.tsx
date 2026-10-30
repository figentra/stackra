/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native FormField: a required rule, an error set on the field, disabled, and valid.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Form, FormField, TextField, useCatalogueText } from "@stackra/ui/native";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { MESSAGES } from "#src/constants/messages.constant";
import { FORM_FIELD_DEMO_KEYS } from "#src/demos/free/form-field/form-field-demo-keys.constant";

import { toFieldControl } from "#src/demos/free/form-field/to-field-control.function";

/** The demo's keys. */
const K = FORM_FIELD_DEMO_KEYS.demo_free.form_field.states;

/** The values of the form. */
interface StateValues {
  required: string;
  invalid: string;
  disabled: string;
  valid: string;
}

/** Each field is bound the same way; the state comes from the form. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const form = useForm<StateValues>({
    defaultValues: { required: "", invalid: "A", disabled: t(K.kept), valid: "Ada Lovelace" },
  });
  const { setError } = form;
  const control = toFieldControl(form.control);
  const invalidMessage = t(K.invalid_message);
  // The error a server or an earlier submit would have set, so the invalid state is on screen without a press.
  useEffect(() => {
    setError("invalid", { type: "manual", message: invalidMessage });
  }, [setError, invalidMessage]);

  return (
    <Form style={{ gap: 16 }}>
      <FormField
        control={control}
        name="required"
        rules={{ required: t(K.required_message) }}
        render={(binding) => <TextField {...binding} label={t(K.required)} />}
      />
      <FormField
        control={control}
        name="invalid"
        render={(binding) => <TextField {...binding} label={t(K.invalid)} />}
      />
      <FormField
        control={control}
        name="disabled"
        disabled
        render={(binding) => <TextField {...binding} label={t(K.disabled)} />}
      />
      <FormField
        control={control}
        name="valid"
        render={(binding) => <TextField {...binding} label={t(K.valid)} />}
      />
    </Form>
  );
}
