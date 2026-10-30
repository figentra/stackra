/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native FormField: three bound fields, a submit, a simulated server error and a reset.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import {
  Button,
  Checkbox,
  Form,
  FormField,
  RadioGroup,
  Text,
  TextField,
  useCatalogueText,
} from "@stackra/ui/native";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { FORM_FIELD_DEMO_KEYS } from "#src/demos/free/form-field/form-field-demo-keys.constant";

import { toFieldControl } from "#src/demos/free/form-field/to-field-control.function";

/** The demo's keys. */
const K = FORM_FIELD_DEMO_KEYS.demo_free.form_field.live;

/** The values of the form. */
interface AccountValues {
  email: string;
  plan: "free" | "team";
  terms: boolean;
}

/** What the readout says last. */
type Status =
  | { readonly kind: "idle" }
  | { readonly kind: "refused"; readonly count: number }
  | { readonly kind: "saved"; readonly email: string; readonly plan: "free" | "team" };

/** One address, loosely: something, an at sign, something, a dot, something. The page's check, not a standard. */
const EMAIL = /^\S+@\S+\.\S+$/;

/** Submit empty to see each rule's message, fix a field to clear it, or simulate a server refusal. */
export default function Live() {
  const form = useForm<AccountValues>({ defaultValues: { email: "", plan: "free", terms: false } });
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const t = useCatalogueText(MESSAGES.en);
  const control = toFieldControl(form.control);
  const plans = [
    { value: "free", label: t(K.free) },
    { value: "team", label: t(K.team) },
  ] as const;

  const save = form.handleSubmit(
    (values) => setStatus({ kind: "saved", email: values.email, plan: values.plan }),
    (errors) => setStatus({ kind: "refused", count: Object.keys(errors).length }),
  );

  return (
    <Form style={{ gap: 16 }}>
      <FormField
        control={control}
        name="email"
        rules={{
          required: t(K.email_required),
          pattern: { value: EMAIL, message: t(K.email_pattern) },
        }}
        render={(binding) => (
          <TextField {...binding} label={t(K.email)} description={t(K.email_hint)} type="email" />
        )}
      />
      <FormField
        control={control}
        name="plan"
        render={(binding) => (
          <RadioGroup
            {...binding}
            onChange={(value) => binding.onChange?.(value as AccountValues["plan"])}
            label={t(K.plan)}
            options={plans}
          />
        )}
      />
      <FormField
        control={control}
        name="terms"
        rules={{ required: t(K.terms_required) }}
        render={(binding) => <Checkbox {...binding} label={t(K.terms)} />}
      />
      <View className="flex-row flex-wrap gap-2">
        <Button onPress={() => void save()}>{t(K.save)}</Button>
        <Button
          variant="secondary"
          onPress={() => {
            form.setError("email", { type: "server", message: t(K.email_taken) });
            setStatus({ kind: "refused", count: 1 });
          }}
        >
          {t(K.reject)}
        </Button>
        <Button
          variant="ghost"
          onPress={() => {
            form.reset();
            setStatus({ kind: "idle" });
          }}
        >
          {t(K.reset)}
        </Button>
      </View>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {status.kind === "idle"
          ? t(K.idle)
          : status.kind === "refused"
            ? t(K.refused, { count: status.count })
            : t(K.saved, { email: status.email, plan: t(K[status.plan]) })}
      </Text>
    </Form>
  );
}
