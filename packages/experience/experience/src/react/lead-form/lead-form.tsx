/**
 * Stackra file contract:
 * Purpose: `LeadForm`, the landing's request form ("Book a demo"): a named section with a heading, a labelled field
 *          per `LeadField`, an optional unticked consent box, an optional verification slot and a submit button. It
 *          posts one `LeadSubmission` as JSON and says whether it arrived.
 * Boundary: composition of @stackra/ui only; every word comes in props and nothing is sent anywhere but `action`.
 *           Required fields use the browser's own validation. The outcome is spoken: success in a status region that
 *           replaces the form, failure in an alert above it with the answers kept. The page's path is read from
 *           `location` at send time.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 16); ADR 0504 (module UI kits); WCAG 2.2 1.3.1, 3.3.1, 3.3.2 and 4.1.3;
 *                     STA-2041.
 */
import { Button, Checkbox, Heading, Text, TextArea, TextField } from "@stackra/ui/react";
import { type FormEvent, type ReactElement, useId, useState } from "react";

import { LEAD_FORM_ACTION } from "#core/constants/lead-form-action.constant";
import { LeadFieldType } from "#core/enums/lead-field-type.enum";
import type { LeadSubmission } from "#core/types/lead-submission.type";
import type { LeadFormProps } from "#react/lead-form/lead-form.props";
import { RuledBand } from "#react/ruled-band/ruled-band";

/** The consent box's input name; a field id never takes it. */
const CONSENT = "consent";

/** The input type and autofill hint of each single-line kind. */
const INPUT = {
  text: { type: "text" },
  email: { type: "email", autoComplete: "email" },
  phone: { type: "tel", autoComplete: "tel" },
} as const;

/**
 * A request form that posts its answers as JSON and says whether they arrived.
 *
 * @example
 * <LeadForm title="Book a demo" fields={fields} submit="Send" success="Thanks, we'll be in touch." failure="Not sent." />
 */
export function LeadForm({
  title,
  line,
  fields,
  consent,
  submit,
  success,
  failure,
  action = LEAD_FORM_ACTION,
  verification,
  className,
}: LeadFormProps): ReactElement {
  const id = useId();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const ids = new Set(fields.map((field) => field.id));
    const extra: Record<string, string> = {};
    for (const [name, value] of data)
      if (typeof value === "string" && !ids.has(name) && name !== CONSENT) extra[name] = value;
    const body: LeadSubmission = {
      fields: Object.fromEntries(
        fields.map((field) => [field.id, String(data.get(field.id) ?? "")]),
      ),
      consent:
        consent === undefined
          ? null
          : {
              document: consent.document,
              version: consent.version,
              text: consent.text,
              granted: data.has(CONSENT),
            },
      sourcePage: globalThis.location.pathname,
      verification: extra,
    };
    setState("sending");
    try {
      const response = await fetch(action, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      setState(response.ok ? "sent" : "failed");
    } catch {
      setState("failed");
    }
  };
  return (
    <RuledBand label={title} {...(className === undefined ? {} : { className })}>
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <Heading level={2} type="h2" id={id}>
          {title}
        </Heading>
        {line === undefined ? null : <Text tone="muted">{line}</Text>}
        {/* Always in the page, so a screen reader announces what lands in it. */}
        <div role="alert">{state === "failed" ? <Text tone="danger">{failure}</Text> : null}</div>
        <div role="status">{state === "sent" ? <Text tone="success">{success}</Text> : null}</div>
        {state === "sent" ? null : (
          <form
            aria-labelledby={id}
            onSubmit={(event) => {
              void send(event);
            }}
            className="flex flex-col gap-4"
          >
            {fields.map((field) =>
              field.type === LeadFieldType.Message ? (
                <TextArea
                  key={field.id}
                  name={field.id}
                  label={field.label}
                  isRequired={field.isRequired === true}
                  isFullWidth
                />
              ) : (
                <TextField
                  key={field.id}
                  name={field.id}
                  label={field.label}
                  isRequired={field.isRequired === true}
                  isFullWidth
                  ai={false}
                  {...INPUT[field.type]}
                />
              ),
            )}
            {consent === undefined ? null : <Checkbox name={CONSENT} label={consent.text} />}
            {verification}
            <div>
              <Button type="submit" isLoading={state === "sending"}>
                {submit}
              </Button>
            </div>
          </form>
        )}
      </div>
    </RuledBand>
  );
}
