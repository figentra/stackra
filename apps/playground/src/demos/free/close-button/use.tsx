/**
 * Stackra file contract:
 * Purpose: the "use" demo of the web Close button: Dismiss the notice to hide it; Show again brings it back.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 3 and 7); WCAG 2.2 SC 4.1.2 and 2.5.8.
 */
import {
  Button,
  Card,
  CloseButton as UiCloseButton,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CLOSE_BUTTON_KEYS } from "#src/demos/free/close-button/close-button-keys.constant";

/** The demo's keys. */
const K = CLOSE_BUTTON_KEYS.close_button;

/** Close button: In use. */
export default function Use() {
  const t = useCatalogueText(MESSAGES.en);
  const [isShown, setIsShown] = useState(true);

  return (
    <div className="grid max-w-sm gap-3">
      {isShown ? (
        <Card>
          <UiCloseButton
            label={t(K.dismiss)}
            className="absolute end-3 top-3"
            onPress={() => setIsShown(false)}
          />
          <Card.Header>
            <Card.Title>{t(K.notice_title)}</Card.Title>
            <Card.Description>
              <bdi>{t(K.notice_body)}</bdi>
            </Card.Description>
          </Card.Header>
        </Card>
      ) : (
        <>
          <Text role="status" tone="muted">
            <bdi>{t(K.hidden)}</bdi>
          </Text>
          <div>
            <Button variant="secondary" onPress={() => setIsShown(true)}>
              {t(K.show_again)}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
