/**
 * Stackra file contract:
 * Purpose: the page of the form-field route: a live react-hook-form form whose email, plan and terms fields are bound
 *          by FormField (rules, a failed and a valid submit, a simulated server rejection, reset), and one form that
 *          shows each state a bound field can be in (required, invalid with its message, disabled by the form, valid),
 *          all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The forms keep their values in
 *           react-hook-form, and the page's status line is polite live text, because a failed submit does not move
 *           focus to the first invalid field yet (FormField does not hand react-hook-form the field's node).
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0055 (forms); ADR 0060 (light, dark,
 *          RTL); WCAG 2.2 SC 3.3.1 and 4.1.3.
 */
import {
  Button,
  Checkbox,
  Form,
  FormField as UiFormField,
  Heading,
  RadioGroup,
  Text,
  TextField,
} from "@stackra/ui/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { PageSection } from "#src/components/page-section";
import { FormFieldRoute } from "#src/routes/form-field/form-field.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::form-field.*` keys.
const STRINGS = {
  documentTitle: `${FormFieldRoute.title} · Stackra Playground`,
  intro:
    "A FormField binds one field to a react-hook-form form. It hands the field its name, value, change and blur handlers, invalid state and message, so the field shows the form's validation without knowing which library holds it.",
  live: "Try it",
  liveNote:
    "Submit empty to see each rule's message, fix a field to clear it, or simulate the server refusing the email.",
  formName: "Account",
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
  states: "States",
  statesNote:
    "Each field is bound the same way; the state comes from the form: a required rule, an error set on the field, the form disabling it, and a valid value.",
  statesName: "Field states",
  required: "Required field",
  invalid: "Invalid field",
  invalidMessage: "Enter a name of at least two letters.",
  disabled: "Disabled field",
  valid: "Valid field",
  kept: "Kept value",
  ada: "Ada Lovelace",
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
  { value: "free", label: STRINGS.free },
  { value: "team", label: STRINGS.team },
] as const;

/** The grid that lays fields out in columns that wrap. */
const GRID = "grid gap-4 sm:grid-cols-2";

/** The live form: three bound fields, a submit, a simulated server error and a reset. */
function LiveForm() {
  const form = useForm<AccountValues>({ defaultValues: { email: "", plan: "free", terms: false } });
  const [status, setStatus] = useState<string>(STRINGS.idle);

  return (
    <Form
      aria-label={STRINGS.formName}
      validationBehavior="aria"
      className="grid max-w-sm gap-4"
      onSubmit={form.handleSubmit(
        (values) =>
          setStatus(
            STRINGS.saved(
              values.email,
              PLANS.find((plan) => plan.value === values.plan)?.label ?? "",
            ),
          ),
        (errors) => setStatus(STRINGS.refused(Object.keys(errors).length)),
      )}
    >
      <UiFormField
        control={form.control}
        name="email"
        rules={{
          required: STRINGS.emailRequired,
          pattern: { value: EMAIL, message: STRINGS.emailPattern },
        }}
        render={(binding) => (
          <TextField
            {...binding}
            label={STRINGS.email}
            description={STRINGS.emailHint}
            type="email"
          />
        )}
      />
      <UiFormField
        control={form.control}
        name="plan"
        render={(binding) => <RadioGroup {...binding} label={STRINGS.plan} options={PLANS} />}
      />
      <UiFormField
        control={form.control}
        name="terms"
        rules={{ required: STRINGS.termsRequired }}
        render={(binding) => <Checkbox {...binding} label={STRINGS.terms} />}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit">{STRINGS.save}</Button>
        <Button
          variant="secondary"
          onPress={() => {
            form.setError("email", { type: "server", message: STRINGS.emailTaken });
            setStatus(STRINGS.refused(1));
          }}
        >
          {STRINGS.reject}
        </Button>
        <Button
          variant="ghost"
          onPress={() => {
            form.reset();
            setStatus(STRINGS.idle);
          }}
        >
          {STRINGS.reset}
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

/** One form that shows each state a bound field can be in. */
function StatesForm() {
  const form = useForm<StateValues>({
    defaultValues: { required: "", invalid: "A", disabled: STRINGS.kept, valid: STRINGS.ada },
  });
  const { setError } = form;
  // The error a server or an earlier submit would have set, so the invalid state is on the page without a click.
  useEffect(() => {
    setError("invalid", { type: "manual", message: STRINGS.invalidMessage });
  }, [setError]);

  return (
    <Form aria-label={STRINGS.statesName} validationBehavior="aria" className={GRID}>
      <UiFormField
        control={form.control}
        name="required"
        rules={{ required: STRINGS.emailRequired }}
        render={(binding) => <TextField {...binding} label={STRINGS.required} />}
      />
      <UiFormField
        control={form.control}
        name="invalid"
        render={(binding) => <TextField {...binding} label={STRINGS.invalid} />}
      />
      <UiFormField
        control={form.control}
        name="disabled"
        disabled
        render={(binding) => <TextField {...binding} label={STRINGS.disabled} />}
      />
      <UiFormField
        control={form.control}
        name="valid"
        render={(binding) => <TextField {...binding} label={STRINGS.valid} />}
      />
    </Form>
  );
}

/** The FormField page. */
export function FormField() {
  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{FormFieldRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="form-field-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <LiveForm />
      </PageSection>

      <PageSection id="form-field-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <StatesForm />
      </PageSection>
    </article>
  );
}
