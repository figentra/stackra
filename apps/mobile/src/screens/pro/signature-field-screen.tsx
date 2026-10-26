/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `SignatureField` (@stackra-pro/ui): sign with a finger or by
 *          typing a name, with what the field reports read out under it, and a required field in its error state.
 * Boundary: presentation and local demo state only; the signature is bound to no document.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decisions 3 and 6); WCAG 2.2 SC 2.1.1; STA-803.
 */
import type { SignatureValue } from "@stackra-pro/ui/contracts";
import { SignatureField } from "@stackra-pro/ui/native";
import { Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  sign: { title: "Sign", description: "Draw in the box, or type your name; Clear empties both." },
  required: {
    title: "Required",
    description: "`isRequired` and `isInvalid` with an `errorMessage`.",
  },
  label: "Signature",
  typed: "Or type your full name",
  clear: "Clear",
  help: "By signing you accept the delivery terms.",
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

/** The SignatureField page. */
export function SignatureFieldScreen() {
  const [value, setValue] = useState<SignatureValue | null>(null);
  return (
    <Screen>
      <Section title={STRINGS.sign.title} description={STRINGS.sign.description}>
        <SignatureField
          label={STRINGS.label}
          typedLabel={STRINGS.typed}
          clearLabel={STRINGS.clear}
          description={STRINGS.help}
          value={value}
          onChange={setValue}
        />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {reportOf(value)}
        </Text>
      </Section>
      <Section title={STRINGS.required.title} description={STRINGS.required.description}>
        <SignatureField
          label={STRINGS.label}
          typedLabel={STRINGS.typed}
          clearLabel={STRINGS.clear}
          isRequired
          isInvalid
          errorMessage={STRINGS.error}
        />
      </Section>
    </Screen>
  );
}
