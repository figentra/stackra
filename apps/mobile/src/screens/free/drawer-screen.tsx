/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Drawer` (@stackra/ui): a drawer opened by its own trigger, a
 *          controlled drawer whose open state the page holds and reads, a drawer that a swipe or a press outside
 *          cannot close, and a drawer holding a field.
 * Boundary: presentation and local demo state only; the drawer is @stackra/ui's, nothing here is styled by hand. A
 *          native drawer is always a bottom sheet, so no sample sets a side.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import { Button, Drawer, Text, TextField } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description:
      "A trigger opens the drawer; its close button, a swipe down or a press outside closes it.",
    open: "Open order details",
    heading: "Order 1042",
    body: "Three items, shipped on Monday. Signed for by the front desk.",
    close: "Close the order details",
  },
  controlled: {
    title: "Controlled",
    description: "The page holds `isOpen`, so its own buttons can open and close the drawer.",
    open: "Open the drawer",
    heading: "Archive the order?",
    body: "Archived orders leave the list and stay in your reports.",
    close: "Close the archive question",
    cancel: "Cancel",
    confirm: "Archive",
    state: (isOpen: boolean) => `The drawer is ${isOpen ? "open" : "closed"}.`,
    last: (action: string | null) => `Last choice: ${action ?? "none"}.`,
  },
  locked: {
    title: "Not dismissable",
    description:
      "`isDismissable` off: a swipe or a press outside does nothing, so the drawer holds its own way out.",
    open: "Open the locked drawer",
    heading: "Finish the setup",
    body: "Choose Done to continue; the drawer does not close any other way.",
    done: "Done",
  },
  form: {
    title: "With a field",
    description: "The drawer moves clear of the keyboard while a field inside it is edited.",
    open: "Rename the order",
    heading: "Rename order",
    field: "Order name",
    close: "Close the rename drawer",
    save: "Save name",
    saved: (name: string) => `Saved as “${name}”.`,
    none: "Not renamed yet.",
  },
} as const;

/** The Drawer page: one section per option, in a scrollable screen. */
export function DrawerScreen() {
  const [isOpen, setIsOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const [isLockedOpen, setIsLockedOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState("Spring restock");
  const [saved, setSaved] = useState<string | null>(null);

  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <Drawer trigger={<Button variant="secondary">{STRINGS.basics.open}</Button>}>
          <Drawer.Header>
            <Drawer.Title>{STRINGS.basics.heading}</Drawer.Title>
            <Drawer.Close label={STRINGS.basics.close} />
          </Drawer.Header>
          <Drawer.Body>{STRINGS.basics.body}</Drawer.Body>
        </Drawer>
      </Section>

      <Section title={STRINGS.controlled.title} description={STRINGS.controlled.description}>
        <Button variant="secondary" onPress={() => setIsOpen(true)}>
          {STRINGS.controlled.open}
        </Button>
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.controlled.state(isOpen)}
        </Text>
        <Text tone="muted">{STRINGS.controlled.last(last)}</Text>
        <Drawer isOpen={isOpen} onOpenChange={setIsOpen}>
          <Drawer.Header>
            <Drawer.Title>{STRINGS.controlled.heading}</Drawer.Title>
            <Drawer.Close label={STRINGS.controlled.close} />
          </Drawer.Header>
          <Drawer.Body>{STRINGS.controlled.body}</Drawer.Body>
          <Drawer.Footer>
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
                setLast(STRINGS.controlled.confirm);
                setIsOpen(false);
              }}
            >
              {STRINGS.controlled.confirm}
            </Button>
          </Drawer.Footer>
        </Drawer>
      </Section>

      <Section title={STRINGS.locked.title} description={STRINGS.locked.description}>
        <Button variant="secondary" onPress={() => setIsLockedOpen(true)}>
          {STRINGS.locked.open}
        </Button>
        <Drawer isOpen={isLockedOpen} onOpenChange={setIsLockedOpen} isDismissable={false}>
          <Drawer.Header>
            <Drawer.Title>{STRINGS.locked.heading}</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>{STRINGS.locked.body}</Drawer.Body>
          <Drawer.Footer>
            <Button onPress={() => setIsLockedOpen(false)}>{STRINGS.locked.done}</Button>
          </Drawer.Footer>
        </Drawer>
      </Section>

      <Section title={STRINGS.form.title} description={STRINGS.form.description}>
        <Button variant="secondary" onPress={() => setIsRenaming(true)}>
          {STRINGS.form.open}
        </Button>
        <Text tone="muted" accessibilityLiveRegion="polite">
          {saved === null ? STRINGS.form.none : STRINGS.form.saved(saved)}
        </Text>
        <Drawer isOpen={isRenaming} onOpenChange={setIsRenaming}>
          <Drawer.Header>
            <Drawer.Title>{STRINGS.form.heading}</Drawer.Title>
            <Drawer.Close label={STRINGS.form.close} />
          </Drawer.Header>
          <Drawer.Body>
            <TextField label={STRINGS.form.field} value={name} onChange={setName} />
          </Drawer.Body>
          <Drawer.Footer>
            <Button
              onPress={() => {
                setSaved(name);
                setIsRenaming(false);
              }}
            >
              {STRINGS.form.save}
            </Button>
          </Drawer.Footer>
        </Drawer>
      </Section>
    </Screen>
  );
}
