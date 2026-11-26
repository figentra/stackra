/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native PushPrimer block (@stackra/notifications): the inline primer of an
 *          onboarding step; turning notifications on spins the button, then the answer shows under the card.
 * Boundary: a demo with no props: the kit block and a container of its own that binds a stand-in `PushRegistration`
 *           answering `granted` after a moment, as an app binds the platform's permission prompt and its generated
 *           client; nothing is asked of the device. Every word from the catalogue. The same file is the preview and
 *           the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); ADR 0504 (module UI kits); ADR 0260 (client ports).
 */
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { PushRegistration, type PushPermission } from "@stackra/notifications/contracts";
import { PushPrimer } from "@stackra/notifications/native";
import { Text, useCatalogueText } from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PUSH_PRIMER_DEMO_KEYS } from "#src/demos/free/push-primer/push-primer-demo-keys.constant";

/** The demo's keys. */
const K = PUSH_PRIMER_DEMO_KEYS.demo_free.push_primer.basics;

/** The demo's container, booted once, with a registration that grants after a moment. */
const BOOT = Container.create([], {
  overrides: new Map([
    [
      PushRegistration,
      Object.assign(Object.create(PushRegistration.prototype) as PushRegistration, {
        register: () =>
          new Promise<PushPermission>((resolve) => {
            setTimeout(() => resolve("granted"), 1200);
          }),
      }),
    ],
  ]),
});

/** Push primer: the inline card of an onboarding step. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [container, setContainer] = useState<Container | undefined>(undefined);
  const [answer, setAnswer] = useState<PushPermission | undefined>(undefined);
  useEffect(() => void BOOT.then(setContainer), []);
  if (container === undefined) return null;
  return (
    <ContainerProvider container={container}>
      <View className="gap-3">
        <PushPrimer
          variant="inline"
          trigger="onboarding"
          idempotencyKey="demo-onboarding-step"
          onPermission={setAnswer}
          labels={{
            title: t(K.title),
            description: t(K.description),
            enable: t(K.enable),
            later: t(K.later),
            failed: t(K.failed),
          }}
        />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {answer === undefined ? "" : answer === "granted" ? t(K.granted) : t(K.postponed)}
        </Text>
      </View>
    </ContainerProvider>
  );
}
