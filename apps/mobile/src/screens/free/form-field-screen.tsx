/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `FormField` (@stackra/ui): a live react-hook-form form whose
 *          email, plan and terms fields are bound by FormField (rules, a failed and a valid submit, a simulated server
 *          rejection, reset), and one form that shows each state a bound field can be in (required, invalid with its
 *          message, disabled by the form, valid).
 * Boundary: presentation and local demo state only; the forms keep their values in react-hook-form, and the status
 *           line is a polite live region because a failed submit does not move focus to the first invalid field.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); ADR 0055 (forms); STA-416 FR-013.
 */
import {
  Button,
  Checkbox,
  Form,
  FormField,
  type FormFieldProps,
  RadioGroup,
  Text,
  TextField,
} from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { type Control, type FieldValues, useForm } from "react-hook-form";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  live: {
    title: "Try it",
    description:
      "Submit empty to see each rule's message, fix a field to clear it, or simulate the server refusing the email.",
    email: "Email",
    emailHint: "We send the receipt here.",
    emailRequired: "Enter your email address.",
    emailPattern: "Enter an address such as name@example.com.",
    emailTaken: "That email address is already in use.",
    plan: "Plan",
    free: "Free",
    team: "Team",
    terms: "I accept the terms",
    termsRequired: "Accept the terms to continue.",
    save: "Save",
    reject: "Simulate a server rejection",
    reset: "Reset",
    idle: "Nothing saved yet.",
    refused: (count: number) =>
      `Not saved: ${count} ${count === 1 ? "field needs" : "fields need"} attention.`,
    saved: (email: string, plan: string) => `Saved ${email} on the ${plan} plan.`,
  },
  states: {
    title: "States",
    description:
      "Each field is bound the same way; the state comes from the form: a required rule, an error set on the field, the form disabling it, and a valid value.",
    required: "Required field",
    requiredMessage: "Enter a value.",
    invalid: "Invalid field",
    invalidMessage: "Enter a name of at least two letters.",
    disabled: "Disabled field",
    valid: "Valid field",
    kept: "Kept value",
    ada: "Ada Lovelace",
  },
} as const;

/** The values of the live form. */
interface AccountValues {
  email: string;
  plan: string;
  terms: boolean;
}

/** The values of the states form. */
interface StateValues {
  required: string;
  invalid: string;
  disabled: string;
  valid: string;
}

/** One address, loosely: something, an at sign, something, a dot, something. The page's check, not a standard. */
const EMAIL = /^\S+@\S+\.\S+$/;

/** The plans the radio group offers. */
const PLANS = [
  { value: "free", label: STRINGS.live.free },
  { value: "team", label: STRINGS.live.team },
] as const;

/**
 * The form's control, typed as @stackra/ui's FormField takes it.
 * shortcut: the app's react-hook-form and the one @stackra/ui resolves are two installs (React 19.2 and 19.3 peers)
 * whose deep types do not match, though Metro loads one copy (metro.config.js); drop it once both share one React.
 */
function toFieldControl<TValues extends FieldValues>(control: Control<TValues>) {
  return control as unknown as NonNullable<FormFieldProps<TValues>["control"]>;
}

/** The live form: three bound fields, a submit, a simulated server error and a reset. */
function LiveForm() {
  const form = useForm<AccountValues>({ defaultValues: { email: "", plan: "free", terms: false } });
  const [status, setStatus] = useState<string>(STRINGS.live.idle);
  const control = toFieldControl(form.control);

  const save = form.handleSubmit(
    (values) =>
      setStatus(
        STRINGS.live.saved(
          values.email,
          PLANS.find((plan) => plan.value === values.plan)?.label ?? "",
        ),
      ),
    (errors) => setStatus(STRINGS.live.refused(Object.keys(errors).length)),
  );

  return (
    <Form style={{ gap: 16 }}>
      <FormField
        control={control}
        name="email"
        rules={{
          required: STRINGS.live.emailRequired,
          pattern: { value: EMAIL, message: STRINGS.live.emailPattern },
        }}
        render={(binding) => (
          <TextField
            {...binding}
            label={STRINGS.live.email}
            description={STRINGS.live.emailHint}
            type="email"
          />
        )}
      />
      <FormField
        control={control}
        name="plan"
        render={(binding) => <RadioGroup {...binding} label={STRINGS.live.plan} options={PLANS} />}
      />
      <FormField
        control={control}
        name="terms"
        rules={{ required: STRINGS.live.termsRequired }}
        render={(binding) => <Checkbox {...binding} label={STRINGS.live.terms} />}
      />
      <View className="flex-row flex-wrap gap-2">
        <Button onPress={() => void save()}>{STRINGS.live.save}</Button>
        <Button
          variant="secondary"
          onPress={() => {
            form.setError("email", { type: "server", message: STRINGS.live.emailTaken });
            setStatus(STRINGS.live.refused(1));
          }}
        >
          {STRINGS.live.reject}
        </Button>
        <Button
          variant="ghost"
          onPress={() => {
            form.reset();
            setStatus(STRINGS.live.idle);
          }}
        >
          {STRINGS.live.reset}
        </Button>
      </View>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {status}
      </Text>
    </Form>
  );
}

/** One form that shows each state a bound field can be in. */
function StatesForm() {
  const form = useForm<StateValues>({
    defaultValues: {
      required: "",
      invalid: "A",
      disabled: STRINGS.states.kept,
      valid: STRINGS.states.ada,
    },
  });
  const { setError } = form;
  const control = toFieldControl(form.control);
  // The error a server or an earlier submit would have set, so the invalid state is on screen without a press.
  useEffect(() => {
    setError("invalid", { type: "manual", message: STRINGS.states.invalidMessage });
  }, [setError]);

  return (
    <Form style={{ gap: 16 }}>
      <FormField
        control={control}
        name="required"
        rules={{ required: STRINGS.states.requiredMessage }}
        render={(binding) => <TextField {...binding} label={STRINGS.states.required} />}
      />
      <FormField
        control={control}
        name="invalid"
        render={(binding) => <TextField {...binding} label={STRINGS.states.invalid} />}
      />
      <FormField
        control={control}
        name="disabled"
        disabled
        render={(binding) => <TextField {...binding} label={STRINGS.states.disabled} />}
      />
      <FormField
        control={control}
        name="valid"
        render={(binding) => <TextField {...binding} label={STRINGS.states.valid} />}
      />
    </Form>
  );
}

/** The FormField page: a live form, then the states, in a scrollable screen. */
export function FormFieldScreen() {
  return (
    <Screen>
      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <LiveForm />
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <StatesForm />
      </Section>
    </Screen>
  );
}
