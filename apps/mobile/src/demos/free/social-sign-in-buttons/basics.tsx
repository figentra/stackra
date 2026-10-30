/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Social sign-in buttons: three providers stacked, and the same as a compact row; a press shows the spinner.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { SocialProvider } from "@stackra/ui/contracts";
import { SocialSignInButtons, Text, useCatalogueText } from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SOCIAL_SIGN_IN_BUTTONS_DEMO_KEYS } from "#src/demos/free/social-sign-in-buttons/social-sign-in-buttons-demo-keys.constant";

/** The demo's keys. */
const K = SOCIAL_SIGN_IN_BUTTONS_DEMO_KEYS.demo_free.social_sign_in_buttons.sample;

/** Social sign-in buttons: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [pending, setPending] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (pending === undefined) return undefined;
    const timer = setTimeout(() => setPending(undefined), 1500);
    return () => clearTimeout(timer);
  }, [pending]);
  // The marks are built in, keyed by the id; a provider with none gets its initial.
  const providers: readonly SocialProvider[] = [
    { id: "apple", name: "Apple" },
    { id: "google", name: "Google" },
    { id: "microsoft", name: "Microsoft" },
    { id: "email", name: t(K.email) },
  ];
  return (
    <View className="gap-4">
      <SocialSignInButtons providers={providers} pendingId={pending} onSignIn={setPending} />
      <Text type="small" tone="muted">
        {t(K.compact)}
      </Text>
      <SocialSignInButtons
        orientation="horizontal"
        providers={providers}
        pendingId={pending}
        onSignIn={setPending}
      />
    </View>
  );
}
