/**
 * Stackra file contract:
 * Purpose: the "stepper" demo of the native Drawer: a three-step form: a Stepper in the sub-header, Back and Next in the footer.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          owner request 2026-10-29 (STA-1371).
 */
import {
  Button,
  Drawer,
  Stepper as Steps,
  Text,
  TextField,
  useCatalogueText,
} from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_DEMO_KEYS } from "#src/demos/free/drawer/drawer-demo-keys.constant";

/** The demo's keys. */
const K = DRAWER_DEMO_KEYS.demo_free.drawer.stepper;

/** Add a product in three steps. */
export default function Stepper() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const steps = [
    { id: "basics", label: t(K.basics) },
    { id: "pricing", label: t(K.pricing) },
    { id: "review", label: t(K.review) },
  ];
  const isLast = step === steps.length - 1;
  const open = (next: boolean) => {
    setIsOpen(next);
    if (!next) setStep(0);
  };
  return (
    <View className="items-start">
      <Button variant="secondary" onPress={() => open(true)}>
        {t(K.open)}
      </Button>
      <Drawer isOpen={isOpen} onOpenChange={open}>
        <Drawer.Header>
          <Drawer.Title>{t(K.heading)}</Drawer.Title>
          <Drawer.Close label={t(K.close)} />
        </Drawer.Header>
        <Drawer.SubHeader>
          <Steps
            label={t(K.heading)}
            steps={steps}
            currentStep={steps[step]?.id ?? ""}
            onStepPress={(id) => setStep(steps.findIndex((item) => item.id === id))}
          />
        </Drawer.SubHeader>
        <Drawer.Body>
          {step === 0 ? (
            <TextField key="name" label={t(K.name)} defaultValue={t(K.name_value)} />
          ) : step === 1 ? (
            <TextField key="price" label={t(K.price)} defaultValue={t(K.price_value)} />
          ) : (
            <Text>{t(K.review_body)}</Text>
          )}
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="secondary" onPress={() => (step > 0 ? setStep(step - 1) : open(false))}>
            {step > 0 ? t(K.back) : t(K.cancel)}
          </Button>
          <Button onPress={() => (isLast ? open(false) : setStep(step + 1))}>
            {isLast ? t(K.finish) : t(K.next)}
          </Button>
        </Drawer.Footer>
      </Drawer>
    </View>
  );
}
