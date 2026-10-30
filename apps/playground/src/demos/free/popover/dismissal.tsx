/**
 * Stackra file contract:
 * Purpose: the "dismissal" demo of the web Popover: By default Escape and a press outside close the popover. A step
 *          the user must finish refuses a press outside; a flow with unsaved work refuses Escape. Both then need a
 *          control inside, here Done.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL); WCAG 2.2 SC 2.1.2 and 2.5.8.
 */
import { Button, Popover as UiPopover, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { POPOVER_KEYS } from "#src/demos/free/popover/popover-keys.constant";

/** The demo's keys. */
const K = POPOVER_KEYS.popover;

/** The row that lays samples out in the middle of the page, where a popover has room on every side. */
const ROW = "flex flex-wrap items-center justify-center gap-4";

/** The width of a popover's surface, so every sample is the same size and the placement checks are steady. */
const SURFACE = "max-w-72";

/** One short paragraph of popover content; `<bdi>` keeps an English full stop at its end inside a right-to-left page. */
function Body({ children }: { readonly children: string }) {
  return (
    <Text>
      <bdi>{children}</bdi>
    </Text>
  );
}

/** Props of {@link ClosableSample}. */
interface ClosableSampleProps {
  /** The trigger's label. */
  readonly label: string;
  /** The popover's title. */
  readonly title: string;
  /** The sentence in the popover. */
  readonly body: string;
  /** Whether a press outside closes it. */
  readonly isDismissable: boolean;
  /** Whether Escape is kept from closing it. */
  readonly isKeyboardDismissDisabled: boolean;
}

/** A popover the page controls, so a button inside it can close it, as a step that refuses outside dismissal must. */
function ClosableSample({
  label,
  title,
  body,
  isDismissable,
  isKeyboardDismissDisabled,
}: ClosableSampleProps) {
  const t = useCatalogueText(MESSAGES.en);
  const [isOpen, setIsOpen] = useState(false);
  return (
    <UiPopover
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      title={title}
      className={SURFACE}
      trigger={<Button variant="secondary">{label}</Button>}
    >
      <div className="grid gap-3">
        <Body>{body}</Body>
        <div>
          <Button size="sm" onPress={() => setIsOpen(false)}>
            {t(K.done)}
          </Button>
        </div>
      </div>
    </UiPopover>
  );
}

/** The Popover demo: dismissal. */
export default function Dismissal() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className={ROW}>
      <li>
        <UiPopover
          title={t(K.dismissable_title)}
          className={SURFACE}
          trigger={<Button variant="secondary">{t(K.dismissable)}</Button>}
        >
          <Body>{t(K.dismissable_body)}</Body>
        </UiPopover>
      </li>
      <li>
        <ClosableSample
          label={t(K.step)}
          title={t(K.step_title)}
          body={t(K.step_body)}
          isDismissable={false}
          isKeyboardDismissDisabled={false}
        />
      </li>
      <li>
        <ClosableSample
          label={t(K.escape)}
          title={t(K.escape_title)}
          body={t(K.escape_body)}
          isDismissable
          isKeyboardDismissDisabled
        />
      </li>
    </ul>
  );
}
