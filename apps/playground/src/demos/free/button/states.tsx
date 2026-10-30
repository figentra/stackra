/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Button: each variant in its default, disabled and loading state.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0303 (decision 7).
 */
import { ButtonVariant } from "@stackra/ui/contracts";
import { Button, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { BUTTON_KEYS } from "#src/routes/button/button-keys.constant";

/** The demo's keys. */
const K = BUTTON_KEYS.button.states;

/** Each variant in its three states. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className="grid gap-4">
      {ButtonVariant.map((variant) => (
        <li key={variant} className="grid gap-2">
          <Text type="small" tone="muted">
            <bdi dir="ltr">{variant}</bdi>
          </Text>
          <div className="flex flex-wrap items-start gap-4">
            <Button variant={variant}>{t(K.default)}</Button>
            <Button variant={variant} isDisabled>
              {t(K.disabled)}
            </Button>
            <Button variant={variant} isLoading>
              {t(K.loading)}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
