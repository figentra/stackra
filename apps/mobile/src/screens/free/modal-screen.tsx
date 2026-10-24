/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Modal` (@stackra/ui): a modal opened by its own trigger, each
 *          width and the full screen, where it sits on the screen, a controlled modal whose open state the page holds
 *          and reads, and a modal that a press outside or the back button cannot close.
 * Boundary: presentation and local demo state only; the modal is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import { Size } from "@stackra/ui/contracts";
import { Button, Modal, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description:
      "A trigger opens the modal; its close button or a press outside closes it. The title names the dialog.",
    open: "Open the modal",
    heading: "Shipping address",
    body: "12 Nile Corniche, Cairo. Deliveries are signed for at the front desk.",
    close: "Close the address",
  },
  sizes: {
    title: "Sizes",
    description: "`size` caps the width at small, medium or large; `full` fills the screen.",
    open: (size: string) => `Open the ${size} modal`,
    heading: (size: string) => `A ${size} modal`,
    body: "The same content in a different width.",
    close: (size: string) => `Close the ${size} modal`,
  },
  position: {
    title: "Position",
    description: "`position` sets where the dialog sits: the top, the centre or the bottom.",
    open: (position: string) => `Open at the ${position}`,
    heading: (position: string) => `At the ${position}`,
    body: "The dialog keeps its width and moves along the screen.",
    close: (position: string) => `Close the modal at the ${position}`,
  },
  controlled: {
    title: "Controlled",
    description: "The page holds `isOpen`, so its own buttons can open and close the modal.",
    open: "Open the controlled modal",
    heading: "Invite a teammate",
    body: "They get an email with a link that works for seven days.",
    close: "Close the invitation",
    cancel: "Cancel",
    send: "Send invitation",
    state: (isOpen: boolean) => `The modal is ${isOpen ? "open" : "closed"}.`,
    last: (action: string | null) => `Last choice: ${action ?? "none"}.`,
  },
  locked: {
    title: "Not dismissable",
    description:
      "`isDismissable` off and `isKeyboardDismissDisabled` on: a press outside, a swipe and the Android back button do nothing.",
    open: "Open the locked modal",
    heading: "Accept the terms",
    body: "Choose Accept to continue; the modal does not close any other way.",
    accept: "Accept",
  },
} as const;

/** The widths of the size samples: the three caps, then the full screen. */
const SIZES = [...Size, "full"] as const;

/** Where the position samples place the dialog. */
const POSITIONS = ["top", "center", "bottom"] as const;

/** The Modal page: one section per option, in a scrollable screen. */
export function ModalScreen() {
  const [isOpen, setIsOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const [isLockedOpen, setIsLockedOpen] = useState(false);

  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <Modal trigger={<Button variant="secondary">{STRINGS.basics.open}</Button>}>
          <Modal.Header>
            <Modal.Title>{STRINGS.basics.heading}</Modal.Title>
            <Modal.Close label={STRINGS.basics.close} />
          </Modal.Header>
          <Modal.Body>{STRINGS.basics.body}</Modal.Body>
        </Modal>
      </Section>

      <Section title={STRINGS.sizes.title} description={STRINGS.sizes.description}>
        {SIZES.map((size) => (
          <Modal
            key={size}
            size={size}
            trigger={
              <Button variant="secondary" size="sm">
                {STRINGS.sizes.open(size)}
              </Button>
            }
          >
            <Modal.Header>
              <Modal.Title>{STRINGS.sizes.heading(size)}</Modal.Title>
              <Modal.Close label={STRINGS.sizes.close(size)} />
            </Modal.Header>
            <Modal.Body>{STRINGS.sizes.body}</Modal.Body>
          </Modal>
        ))}
      </Section>

      <Section title={STRINGS.position.title} description={STRINGS.position.description}>
        {POSITIONS.map((position) => (
          <Modal
            key={position}
            position={position}
            trigger={
              <Button variant="secondary" size="sm">
                {STRINGS.position.open(position)}
              </Button>
            }
          >
            <Modal.Header>
              <Modal.Title>{STRINGS.position.heading(position)}</Modal.Title>
              <Modal.Close label={STRINGS.position.close(position)} />
            </Modal.Header>
            <Modal.Body>{STRINGS.position.body}</Modal.Body>
          </Modal>
        ))}
      </Section>

      <Section title={STRINGS.controlled.title} description={STRINGS.controlled.description}>
        <Button variant="secondary" onPress={() => setIsOpen(true)}>
          {STRINGS.controlled.open}
        </Button>
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.controlled.state(isOpen)}
        </Text>
        <Text tone="muted">{STRINGS.controlled.last(last)}</Text>
        <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
          <Modal.Header>
            <Modal.Title>{STRINGS.controlled.heading}</Modal.Title>
            <Modal.Close label={STRINGS.controlled.close} />
          </Modal.Header>
          <Modal.Body>{STRINGS.controlled.body}</Modal.Body>
          <Modal.Footer>
            <Button
              variant="tertiary"
              onPress={() => {
                setLast(STRINGS.controlled.cancel);
                setIsOpen(false);
              }}
            >
              {STRINGS.controlled.cancel}
            </Button>
            <Button
              onPress={() => {
                setLast(STRINGS.controlled.send);
                setIsOpen(false);
              }}
            >
              {STRINGS.controlled.send}
            </Button>
          </Modal.Footer>
        </Modal>
      </Section>

      <Section title={STRINGS.locked.title} description={STRINGS.locked.description}>
        <Button variant="secondary" onPress={() => setIsLockedOpen(true)}>
          {STRINGS.locked.open}
        </Button>
        <Modal
          isOpen={isLockedOpen}
          onOpenChange={setIsLockedOpen}
          isDismissable={false}
          isKeyboardDismissDisabled
        >
          <Modal.Header>
            <Modal.Title>{STRINGS.locked.heading}</Modal.Title>
          </Modal.Header>
          <Modal.Body>{STRINGS.locked.body}</Modal.Body>
          <Modal.Footer>
            <Button onPress={() => setIsLockedOpen(false)}>{STRINGS.locked.accept}</Button>
          </Modal.Footer>
        </Modal>
      </Section>
    </Screen>
  );
}
