/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native `useConfirmation`: four questions (plain, destructive, custom icon, typed name)
 *          awaited as booleans, and a readout of the last answer.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           The demo mounts its own `ConfirmationProvider` (the app root has none); it is scoped, not global.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { ConfirmationOptions } from "@stackra/ui/contracts";
import {
  Button,
  ConfirmationProvider,
  Text,
  useCatalogueText,
  useConfirmation,
} from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { USE_CONFIRMATION_DEMO_KEYS } from "#src/demos/free/use-confirmation/use-confirmation-demo-keys.constant";

/** The demo's keys. */
const K = USE_CONFIRMATION_DEMO_KEYS.demo_free.use_confirmation;

/** The buttons call the hook, so they sit below the provider. */
function Questions() {
  const confirm = useConfirmation();
  const [answer, setAnswer] = useState<string | null>(null);
  const t = useCatalogueText(MESSAGES.en);
  const words = (q: typeof K.basics) => ({
    title: t(q.question),
    description: t(q.body),
    confirmLabel: t(q.confirm),
    cancelLabel: t(q.cancel),
  });
  const questions: readonly { readonly open: string; readonly options: ConfirmationOptions }[] = [
    { open: t(K.basics.open), options: words(K.basics) },
    { open: t(K.danger.open), options: { tone: "danger", ...words(K.danger) } },
    { open: t(K.bell.open), options: { tone: "accent", icon: Icons.Bell, ...words(K.bell) } },
    {
      open: t(K.typed.open),
      options: {
        tone: "danger",
        ...words(K.typed),
        confirmationText: "Atlas",
        confirmationLabel: t(K.typed.field),
      },
    },
  ];

  /** Asks, awaits the boolean and names the question it answered. */
  const ask = async (open: string, options: ConfirmationOptions) => {
    const yes = await confirm(options);
    setAnswer(t(K.live.answered, { name: open, answer: t(yes ? K.live.yes : K.live.no) }));
  };

  return (
    <View className="items-start gap-3">
      {questions.map(({ open, options }) => (
        <Button key={open} variant="secondary" onPress={() => void ask(open, options)}>
          {open}
        </Button>
      ))}
      <Text tone="muted" accessibilityLiveRegion="polite">
        {answer ?? t(K.live.none)}
      </Text>
    </View>
  );
}

/** Each question resolves to a boolean; the readout shows the last one. */
export default function Live() {
  return (
    <ConfirmationProvider>
      <Questions />
    </ConfirmationProvider>
  );
}
