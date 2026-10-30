/**
 * Stackra file contract:
 * Purpose: the "dismissal" demo of the web Drawer: By default a press outside the drawer and the Escape key close it.
 *          A step the user must finish turns them off and keeps its own close button.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL); WCAG 2.2 SC 2.1.1, 2.1.2, 2.4.3 and 4.1.2.
 */
import type { DrawerProps } from "@stackra/ui/react";
import { Button, Drawer as UiDrawer, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DRAWER_KEYS } from "#src/demos/free/drawer/drawer-keys.constant";

/** The demo's keys. */
const K = DRAWER_KEYS.drawer;

/** The list that lays triggers out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** Props of {@link Sample}. */
interface SampleProps extends Pick<
  DrawerProps,
  "placement" | "isDismissable" | "isKeyboardDismissDisabled"
> {
  /** The label of the button that opens the drawer. */
  readonly buttonLabel: string;
  /** The drawer's title. */
  readonly title: string;
  /** The sentence in the drawer's body. */
  readonly body: string;
}

/** One drawer with its own trigger button, a close button, a title, a body sentence and a Cancel button. */
function Sample({ buttonLabel, title, body, ...drawerProps }: SampleProps) {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <UiDrawer trigger={<Button variant="secondary">{buttonLabel}</Button>} {...drawerProps}>
      <UiDrawer.Header>
        <UiDrawer.Title>{title}</UiDrawer.Title>
        <UiDrawer.Close label={t(K.close)} />
      </UiDrawer.Header>
      <UiDrawer.Body>
        <Text>
          <bdi>{body}</bdi>
        </Text>
      </UiDrawer.Body>
      <UiDrawer.Footer>
        <Button variant="secondary" slot="close">
          {t(K.cancel)}
        </Button>
      </UiDrawer.Footer>
    </UiDrawer>
  );
}

/** Drawer: Dismissal. */
export default function Dismissal() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className={ROW}>
      <li>
        <Sample buttonLabel={t(K.open_default)} title={t(K.dismissal_title)} body={t(K.body)} />
      </li>
      <li>
        <Sample
          buttonLabel={t(K.open_outside_off)}
          title={t(K.dismissal_title)}
          body={t(K.outside_off_body)}
          isDismissable={false}
        />
      </li>
      <li>
        <Sample
          buttonLabel={t(K.open_escape_off)}
          title={t(K.dismissal_title)}
          body={t(K.escape_off_body)}
          isKeyboardDismissDisabled
        />
      </li>
    </ul>
  );
}
