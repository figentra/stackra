/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `ErrorState` (@stackra/ui): one state per kind of failure, the
 *          error's own message shown as details, a retry button, further actions, and a live state whose retry fails
 *          twice before the content comes back.
 * Boundary: presentation and local demo state only; the error state is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import { ErrorStateKind } from "@stackra/ui/contracts";
import { Button, ErrorState, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  kinds: {
    title: "Kinds",
    description:
      "`kind` says what failed and picks the icon: signed out, refused, not found, or unexpected.",
    titles: {
      unauthenticated: "Sign in to continue",
      forbidden: "You do not have access",
      "not-found": "That page does not exist",
      unexpected: "Something went wrong",
    },
    descriptions: {
      unauthenticated: "Your session has ended.",
      forbidden: "Ask the owner of the workspace to invite you.",
      "not-found": "The link may be old, or the page may have moved.",
      unexpected: "We have been told. Try again in a moment.",
    },
  },
  details: {
    title: "Error details",
    description:
      "`error` is the thrown value; `isMessageShown` shows its message, which production hides unless the app says it is safe.",
    heading: "The orders could not be loaded",
    message: "The order service did not answer within 10 seconds.",
  },
  retry: {
    title: "Retry",
    description: "`retry` draws the button that tries again; the readout counts the presses.",
    heading: "The invoice could not be sent",
    label: "Try again",
    count: (count: number) => (count === 1 ? "Retried once." : `Retried ${count} times.`),
    none: "Not retried yet.",
  },
  actions: {
    title: "With actions",
    description: "`actions` add further next steps beside the retry.",
    heading: "The upload failed",
    retry: "Upload again",
    choose: "Choose another file",
    contact: "Contact support",
  },
  live: {
    title: "Try it",
    description: "The first two retries fail again; the third one succeeds.",
    heading: "The report could not be built",
    retry: "Build again",
    done: "The report is ready.",
    reset: "Fail it again",
    attempts: (count: number) => `Attempts so far: ${count}.`,
  },
} as const;

/** How many attempts fail before the live sample succeeds. */
const FAILURES = 2;

/** The ErrorState page: one section per option, in a scrollable screen. */
export function ErrorStateScreen() {
  const [retries, setRetries] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const isDone = attempts > FAILURES;

  return (
    <Screen>
      <Section title={STRINGS.kinds.title} description={STRINGS.kinds.description}>
        {ErrorStateKind.map((kind) => (
          <ErrorState
            key={kind}
            kind={kind}
            headingLevel={3}
            title={STRINGS.kinds.titles[kind]}
            description={STRINGS.kinds.descriptions[kind]}
          />
        ))}
      </Section>

      <Section title={STRINGS.details.title} description={STRINGS.details.description}>
        <ErrorState
          headingLevel={3}
          title={STRINGS.details.heading}
          error={STRINGS.details.message}
          isMessageShown
        />
      </Section>

      <Section title={STRINGS.retry.title} description={STRINGS.retry.description}>
        <ErrorState
          headingLevel={3}
          title={STRINGS.retry.heading}
          retry={{ label: STRINGS.retry.label, onPress: () => setRetries((count) => count + 1) }}
        />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {retries === 0 ? STRINGS.retry.none : STRINGS.retry.count(retries)}
        </Text>
      </Section>

      <Section title={STRINGS.actions.title} description={STRINGS.actions.description}>
        <ErrorState
          headingLevel={3}
          title={STRINGS.actions.heading}
          retry={{ label: STRINGS.actions.retry, onPress: () => undefined }}
          actions={
            <>
              <Button variant="secondary">{STRINGS.actions.choose}</Button>
              <Button variant="tertiary">{STRINGS.actions.contact}</Button>
            </>
          }
        />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        {isDone ? (
          <>
            <Text accessibilityLiveRegion="polite">{STRINGS.live.done}</Text>
            <Button size="sm" variant="secondary" onPress={() => setAttempts(0)}>
              {STRINGS.live.reset}
            </Button>
          </>
        ) : (
          <ErrorState
            headingLevel={3}
            title={STRINGS.live.heading}
            retry={{ label: STRINGS.live.retry, onPress: () => setAttempts((count) => count + 1) }}
          />
        )}
        <Text tone="muted">{STRINGS.live.attempts(attempts)}</Text>
      </Section>
    </Screen>
  );
}
