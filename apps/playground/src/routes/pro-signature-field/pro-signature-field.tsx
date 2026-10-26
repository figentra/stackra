/**
 * Stackra file contract:
 * Purpose: the page of the Signature field route: `@stackra-pro/ui`'s SignatureField to sign by drawing or by typing a
 *          name, with what it reports written under it, and a required field shown in its error state.
 * Boundary: presentation only; the signature is local state and is bound to no document (that is the e-signature
 *           port of `@stackra/documents`).
 * Runtime: browser
 * Governing contract: ADR 0310 (decisions 3 and 12); WCAG 2.2 SC 2.1.1 and 3.3.2; STA-803.
 */
import type { SignatureValue } from "@stackra-pro/ui/contracts";
import * as UiPro from "@stackra-pro/ui/react";
import { useState } from "react";

import { ProSignatureFieldRoute } from "#src/routes/pro-signature-field/pro-signature-field.route";

// shortcut: English strings in one place until the playground reads `playground::*` keys (STA-788).
const STRINGS = {
  documentTitle: `${ProSignatureFieldRoute.title} · Stackra Playground`,
  intro:
    "Sign by drawing in the box with a mouse, pen or finger, or by typing your name, the keyboard way. Clear empties both.",
  sign: "Sign",
  label: "Signature",
  typed: "Or type your full name",
  clear: "Clear",
  description: "By signing you accept the delivery terms.",
  required: "Required",
  error: "Sign before you submit.",
  none: "Not signed",
  drawn: "Signed by drawing",
  typedResult: (name: string) => `Signed as ${name}`,
} as const;

/** What the field reports, in words. */
const reportOf = (value: SignatureValue | null): string =>
  value === null
    ? STRINGS.none
    : value.kind === "drawn"
      ? STRINGS.drawn
      : STRINGS.typedResult(value.text);

/** The Signature field page. */
export function ProSignatureField() {
  const [value, setValue] = useState<SignatureValue | null>(null);
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProSignatureFieldRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="sign-heading" className="grid max-w-md gap-3">
        <h2 id="sign-heading" className="type-h2">
          {STRINGS.sign}
        </h2>
        <UiPro.SignatureField
          label={STRINGS.label}
          typedLabel={STRINGS.typed}
          clearLabel={STRINGS.clear}
          description={STRINGS.description}
          value={value}
          onChange={setValue}
        />
        <p role="status" className="text-sm text-muted">
          {reportOf(value)}
        </p>
      </section>
      <section aria-labelledby="required-heading" className="grid max-w-md gap-3">
        <h2 id="required-heading" className="type-h2">
          {STRINGS.required}
        </h2>
        <UiPro.SignatureField
          label={STRINGS.label}
          typedLabel={STRINGS.typed}
          clearLabel={STRINGS.clear}
          isRequired
          isInvalid
          errorMessage={STRINGS.error}
        />
      </section>
    </article>
  );
}
