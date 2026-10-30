/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the web Icon button: One row per size, one button per variant. The danger variants
 *          are labelled Delete, the others Settings.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 3 and 7); WCAG 2.2 SC 4.1.2 and 2.5.8.
 */
import { ButtonVariant, Size } from "@stackra/ui/contracts";
import { Heading, IconButton as UiIconButton, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ICON_BUTTON_KEYS } from "#src/demos/free/icon-button/icon-button-keys.constant";

/** The demo's keys. */
const K = ICON_BUTTON_KEYS.icon_button;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** The icon of a variant: danger variants delete, the rest open settings. */
const isDanger = (variant: ButtonVariant) => variant === "danger" || variant === "danger-soft";

/** Icon button: Variants and sizes. */
export default function Variants() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <>
      {Size.map((size) => (
        <div key={size} className="grid gap-2">
          <Heading level={3}>{t(K.size, { size })}</Heading>
          <ul className={ROW}>
            {ButtonVariant.map((variant) => (
              <li key={variant}>
                <UiIconButton
                  variant={variant}
                  size={size}
                  label={isDanger(variant) ? t(K.delete) : t(K.settings)}
                  icon={isDanger(variant) ? "trash" : "settings"}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
