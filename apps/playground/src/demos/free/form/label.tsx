/**
 * Stackra file contract:
 * Purpose: the "label" demo of the web Form: Each state beside the control it names. The asterisk marks a required
 *          field.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0055 (forms); ADR 0060 (light, dark, RTL); WCAG 2.2 SC 1.3.1, 3.3.1 and 3.3.3.
 */
import { Label, useCatalogueText } from "@stackra/ui/react";
import { useId } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FORM_KEYS } from "#src/demos/free/form/form-keys.constant";

/** The demo's keys. */
const K = FORM_KEYS.form;

/** HeroUI's own field look, for the plain controls: border, background, focus ring, invalid and disabled states. */
const CONTROL = "input w-full";

/** A label with its plain control, in one of the four states. */
function LabelSample({
  sample,
}: {
  sample: {
    readonly id: string;
    readonly text: string;
    readonly isRequired?: true;
    readonly isInvalid?: true;
    readonly isDisabled?: true;
  };
}) {
  const isRequired = "isRequired" in sample;
  const isInvalid = "isInvalid" in sample;
  const isDisabled = "isDisabled" in sample;
  // Unique per mount: the page shows this demo more than once, and a label must name exactly one control.
  const id = `${useId()}-${sample.id}`;
  return (
    <div className="grid gap-1">
      <Label htmlFor={id} isRequired={isRequired} isInvalid={isInvalid} isDisabled={isDisabled}>
        {sample.text}
      </Label>
      <input
        id={id}
        className={CONTROL}
        required={isRequired}
        disabled={isDisabled}
        aria-invalid={isInvalid || undefined}
        data-invalid={isInvalid || undefined}
      />
    </div>
  );
}

/** Form: Label. */
export default function LabelDemo() {
  const t = useCatalogueText(MESSAGES.en);
  /** The four states of the label, each beside a control that shows the same state. */
  const LABEL_SAMPLES = [
    { id: "label-default", text: t(K.label_default) },
    { id: "label-required", text: t(K.label_required), isRequired: true },
    { id: "label-invalid", text: t(K.label_invalid), isInvalid: true },
    { id: "label-disabled", text: t(K.label_disabled), isDisabled: true },
  ] as const;
  return (
    <div className="grid max-w-sm gap-4">
      {LABEL_SAMPLES.map((sample) => (
        <LabelSample key={sample.id} sample={sample} />
      ))}
    </div>
  );
}
