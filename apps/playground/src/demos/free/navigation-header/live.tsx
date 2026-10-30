/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Navigation header: Press the back button and the action, and switch the large
 *          title. The page reports each one below the header.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317 (decisions 4, 5 and 7); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1,
 *          2.4.6, 2.5.8 and 4.1.3.
 */
import {
  IconButton,
  NavigationHeader as UiNavigationHeader,
  Switch,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { NAVIGATION_HEADER_KEYS } from "#src/demos/free/navigation-header/navigation-header-keys.constant";

/** The demo's keys. */
const K = NAVIGATION_HEADER_KEYS.navigation_header;

/** The box a header sits in, as a screen would hold it. */
const BOX = "overflow-hidden border border-border";

/** Navigation header: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [backCount, setBackCount] = useState(0);

  const [added, setAdded] = useState(0);

  const [isLarge, setIsLarge] = useState(false);

  return (
    <div className="grid gap-3">
      <Switch label={t(K.large_switch)} value={isLarge} onChange={setIsLarge} />
      <div className={BOX} data-sample="live">
        <UiNavigationHeader
          headingLevel={3}
          title={t(K.title)}
          hasLargeTitle={isLarge}
          onBack={() => setBackCount((count) => count + 1)}
          endContent={
            <IconButton
              icon="plus"
              label={t(K.add)}
              variant="ghost"
              onPress={() => setAdded((count) => count + 1)}
            />
          }
        />
      </div>
      <div className="grid gap-1" data-sample="live-status">
        <Text role="status" tone="muted">
          {t(K.back_status, { count: backCount })}
        </Text>
        <Text role="status" tone="muted">
          {t(K.action_status, { count: added })}
        </Text>
        <Text role="status" tone="muted">
          {t(K.title_status, { is_large: isLarge })}
        </Text>
      </div>
    </div>
  );
}
