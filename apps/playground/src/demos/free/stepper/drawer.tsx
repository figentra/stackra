/**
 * Stackra file contract:
 * Purpose: the "drawer" demo of the web Stepper: a new order in three steps, the Stepper in the drawer's sub-header so it stays put while the body scrolls.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (owner request 2026-10-29).
 */
import { Button, Drawer, Stepper, Text, TextField, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { STEPPER_KEYS } from "#src/demos/free/stepper/stepper-keys.constant";

/** The demo's keys. */
const K = STEPPER_KEYS.stepper.drawer;

/** Stepper: inside a drawer. */
export default function InDrawer() {
  const t = useCatalogueText(MESSAGES.en);
  const steps = [
    { id: "customer", label: t(K.customer) },
    { id: "items", label: t(K.items) },
    { id: "delivery", label: t(K.delivery) },
  ];
  const [at, setAt] = useState(0);
  const isLast = at === steps.length - 1;
  return (
    <Drawer
      onOpenChange={(isOpen) => isOpen || setAt(0)}
      trigger={<Button variant="secondary">{t(K.open)}</Button>}
    >
      <Drawer.Header>
        <Drawer.Title>{t(K.title)}</Drawer.Title>
        <Drawer.Close label={t(K.close)} />
      </Drawer.Header>
      <Drawer.SubHeader>
        <Stepper
          label={t(K.label)}
          steps={steps}
          currentStep={steps[at]?.id ?? ""}
          onStepPress={(id) => setAt(steps.findIndex((step) => step.id === id))}
        />
      </Drawer.SubHeader>
      <Drawer.Body>
        {at === 0 ? (
          <TextField
            key="customer_name"
            label={t(K.customer_name)}
            defaultValue={t(K.customer_value)}
          />
        ) : at === 1 ? (
          <TextField key="item" label={t(K.item)} defaultValue={t(K.item_value)} />
        ) : (
          <Text>{t(K.delivery_body)}</Text>
        )}
      </Drawer.Body>
      <Drawer.Footer>
        {at > 0 ? (
          <Button variant="secondary" onPress={() => setAt(at - 1)}>
            {t(K.back)}
          </Button>
        ) : (
          <Button variant="secondary" slot="close">
            {t(K.cancel)}
          </Button>
        )}
        {isLast ? (
          <Button slot="close">{t(K.create)}</Button>
        ) : (
          <Button onPress={() => setAt(at + 1)}>{t(K.next)}</Button>
        )}
      </Drawer.Footer>
    </Drawer>
  );
}
