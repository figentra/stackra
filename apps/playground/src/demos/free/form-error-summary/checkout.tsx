/**
 * Stackra file contract:
 * Purpose: the "checkout" demo of the web FormErrorSummary: a contact form that, sent with empty or wrong fields, shows
 *          the summary above it; each link jumps to its field, and focus lands on the summary after every failed send.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import {
  Button,
  Form as UiForm,
  FormErrorSummary,
  Text,
  TextField,
  useCatalogueText,
} from "@stackra/ui/react";
import { type FormEvent, useId, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FORM_ERROR_SUMMARY_KEYS } from "#src/demos/free/form-error-summary/form-error-summary-keys.constant";

/** The demo's keys. */
const K = FORM_ERROR_SUMMARY_KEYS.form_error_summary;

/** One address, loosely: something, an at sign, something, a dot, something. The page's check, not a standard. */
const EMAIL = /^\S+@\S+\.\S+$/;

/** Form error summary: a form that lists its problems above it after a failed send. */
export default function Checkout() {
  const t = useCatalogueText(MESSAGES.en);
  // useId, not a literal: the page draws a demo more than once (its section, the hero, the RTL panel).
  const id = useId();
  const [values, setValues] = useState({ name: "", email: "", phone: "" });
  const [attempts, setAttempts] = useState(0);
  const [isSent, setIsSent] = useState(false);
  const problems = [
    ...(values.name.trim()
      ? []
      : [{ field: `${id}-name`, label: t(K.name), message: t(K.name_error) }]),
    ...(EMAIL.test(values.email)
      ? []
      : [{ field: `${id}-email`, label: t(K.email), message: t(K.email_error) }]),
    ...(/^\+?[\d\s]{8,}$/.test(values.phone)
      ? []
      : [{ field: `${id}-phone`, label: t(K.phone), message: t(K.phone_error) }]),
  ];
  // The summary lists the problems found at the last send, so it does not appear while the reader first types.
  const shown = attempts > 0 ? problems : [];
  const invalid = (field: string) => shown.some((problem) => problem.field === field);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempts(attempts + 1);
    setIsSent(problems.length === 0);
  };
  const field = (key: "name" | "email" | "phone", type: "text" | "email" | "tel") => (
    <TextField
      name={`${id}-${key}`}
      type={type}
      label={t(K[key])}
      value={values[key]}
      onChange={(value) => setValues({ ...values, [key]: value })}
      isInvalid={invalid(`${id}-${key}`)}
      errorMessage={t(K[`${key}_error`])}
    />
  );
  return (
    <UiForm
      aria-label={t(K.form_name)}
      validationBehavior="aria"
      onSubmit={onSubmit}
      className="grid w-full max-w-md gap-4"
    >
      <FormErrorSummary errors={shown} submitCount={attempts} />
      {field("name", "text")}
      {field("email", "email")}
      {field("phone", "tel")}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit">{t(K.submit)}</Button>
        <Text tone="muted">
          <output aria-live="polite">{isSent ? t(K.sent) : ""}</output>
        </Text>
      </div>
    </UiForm>
  );
}
