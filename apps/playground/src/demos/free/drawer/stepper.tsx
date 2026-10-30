/**
 * Stackra file contract:
 * Purpose: the "stepper" demo of the web Drawer: a three-step form: the sub-header holds a Stepper (a finished step can be pressed
 *          to go back to it), the footer moves Back and Next, and the last step adds the product.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060
 *          (light, dark, RTL); owner request 2026-10-29 (STA-1371); WCAG 2.2 SC 2.1.2, 2.4.3 and 4.1.2.
 */
import {
  Button,
  Drawer,
  Stepper as Steps,
  Text,
  TextField,
  useCatalogueText,
} from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_KEYS } from "#src/demos/free/drawer/drawer-keys.constant";

/** The demo's keys. */
const K = DRAWER_KEYS.drawer;

/** Drawer: With a stepper. */
export default function Stepper() {
  const t = useCatalogueText(MESSAGES.en);
  const [step, setStep] = useState(0);
  const steps = [
    { id: "basics", label: t(K.step_basics) },
    { id: "pricing", label: t(K.step_pricing) },
    { id: "review", label: t(K.step_review) },
  ];
  const isLast = step === steps.length - 1;
  return (
    <Drawer
      onOpenChange={(isOpen) => isOpen || setStep(0)}
      trigger={<Button variant="secondary">{t(K.wizard_open)}</Button>}
    >
      <Drawer.Header>
        <Drawer.Title>{t(K.wizard_title)}</Drawer.Title>
        <Drawer.Close label={t(K.close)} />
      </Drawer.Header>
      <Drawer.SubHeader>
        <Steps
          label={t(K.wizard_title)}
          steps={steps}
          currentStep={steps[step]?.id ?? ""}
          onStepPress={(id) => setStep(steps.findIndex((item) => item.id === id))}
        />
      </Drawer.SubHeader>
      <Drawer.Body>
        {step === 0 ? (
          <TextField
            key="product_name"
            label={t(K.product_name)}
            defaultValue={t(K.product_name_value)}
          />
        ) : step === 1 ? (
          <TextField
            key="price"
            label={t(K.price)}
            defaultValue={t(K.price_value)}
            inputMode="decimal"
          />
        ) : (
          <Text>{t(K.review_body)}</Text>
        )}
      </Drawer.Body>
      <Drawer.Footer>
        {step > 0 ? (
          <Button variant="secondary" onPress={() => setStep(step - 1)}>
            {t(K.back)}
          </Button>
        ) : (
          <Button variant="secondary" slot="close">
            {t(K.cancel)}
          </Button>
        )}
        {isLast ? (
          <Button slot="close">{t(K.finish)}</Button>
        ) : (
          <Button onPress={() => setStep(step + 1)}>{t(K.next)}</Button>
        )}
      </Drawer.Footer>
    </Drawer>
  );
}
