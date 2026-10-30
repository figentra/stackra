/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Form field: Submit empty to see each rule’s message, fix a field to clear it,
 *          or simulate the server refusing the email.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0055 (forms); ADR 0060 (light, dark, RTL); WCAG 2.2 SC 3.3.1 and 4.1.3.
 */
import {
  Button,
  Checkbox,
  Form,
  FormField as UiFormField,
  RadioGroup,
  Text,
  TextField,
  useCatalogueText,
} from "@stackra/ui/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { MESSAGES } from "#src/constants/messages.constant";
import { FORM_FIELD_KEYS } from "#src/demos/free/form-field/form-field-keys.constant";

/** The demo's keys. */
const K = FORM_FIELD_KEYS.form_field;

/** The values of the live form. */
interface AccountValues {
  email: string;
  plan: string;
  terms: boolean;
}

/** One address, loosely: something, an at sign, something, a dot, something. The page's check, not a standard. */
const EMAIL = /^\S+@\S+\.\S+$/;

/** The live form: three bound fields, a submit, a simulated server error and a reset. */
function LiveForm() {
  const t = useCatalogueText(MESSAGES.en);
  /** The plans the radio group offers. */
  const PLANS = [
    { value: "free", label: t(K.free) },
    { value: "team", label: t(K.team) },
  ] as const;
  const form = useForm<AccountValues>({ defaultValues: { email: "", plan: "free", terms: false } });
  const [status, setStatus] = useState<string>(t(K.idle));

  return (
    <Form
      aria-label={t(K.form_name)}
      validationBehavior="aria"
      className="grid max-w-sm gap-4"
      onSubmit={form.handleSubmit(
        (values) =>
          setStatus(
            t(K.saved, {
              email: values.email,
              plan: PLANS.find((plan) => plan.value === values.plan)?.label ?? "",
            }),
          ),
        (errors) => setStatus(t(K.refused, { count: Object.keys(errors).length })),
      )}
    >
      <UiFormField
        control={form.control}
        name="email"
        rules={{
          required: t(K.email_required),
          pattern: { value: EMAIL, message: t(K.email_pattern) },
        }}
        render={(binding) => (
          <TextField {...binding} label={t(K.email)} description={t(K.email_hint)} type="email" />
        )}
      />
      <UiFormField
        control={form.control}
        name="plan"
        render={(binding) => <RadioGroup {...binding} label={t(K.plan)} options={PLANS} />}
      />
      <UiFormField
        control={form.control}
        name="terms"
        rules={{ required: t(K.terms_required) }}
        render={(binding) => <Checkbox {...binding} label={t(K.terms)} />}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit">{t(K.save)}</Button>
        <Button
          variant="secondary"
          onPress={() => {
            form.setError("email", { type: "server", message: t(K.email_taken) });
            setStatus(t(K.refused, { count: 1 }));
          }}
        >
          {t(K.reject)}
        </Button>
        <Button
          variant="ghost"
          onPress={() => {
            form.reset();
            setStatus(t(K.idle));
          }}
        >
          {t(K.reset)}
        </Button>
      </div>
      <Text tone="muted">
        <output aria-live="polite" data-testid="status">
          <bdi>{status}</bdi>
        </output>
      </Text>
    </Form>
  );
}

/** Form field: Try it. */
export default function Live() {
  return <LiveForm />;
}
