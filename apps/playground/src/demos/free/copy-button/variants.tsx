/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the web CopyButton: each button variant and size.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); design-system gap inventory row 35.
 */
import { CopyButton, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { COPY_BUTTON_KEYS } from "#src/demos/free/copy-button/copy-button-keys.constant";

/** The demo's keys. */
const K = COPY_BUTTON_KEYS.copy_button;

/** CopyButton: Variants. */
export default function Variants() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-3">
      {(["ghost", "secondary", "tertiary"] as const).map((variant) => (
        <div key={variant} className="flex items-center gap-2">
          {(["sm", "md", "lg"] as const).map((size) => (
            <CopyButton key={size} value="SKU-55821" variant={variant} size={size} />
          ))}
          <span className="text-xs text-muted">{t(K.variant, { variant })}</span>
        </div>
      ))}
    </div>
  );
}
