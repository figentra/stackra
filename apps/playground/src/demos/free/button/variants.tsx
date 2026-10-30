/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the web Button: every variant in every size, one row per size.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0303 (decision 7).
 */
import { ButtonVariant, Size } from "@stackra/ui/contracts";
import { Button, Heading, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { BUTTON_KEYS } from "#src/routes/button/button-keys.constant";

/** The demo's keys. */
const K = BUTTON_KEYS.button.variants;

/** Every variant in every size. */
export default function Variants() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-4">
      {Size.map((size) => (
        <div key={size} className="grid gap-2">
          <Heading level={3} type="h6">
            {t(K.size, { size })}
          </Heading>
          <ul className="flex flex-wrap items-start gap-4">
            {ButtonVariant.map((variant) => (
              <li key={variant}>
                <Button variant={variant} size={size}>
                  {variant}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
