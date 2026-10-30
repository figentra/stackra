/**
 * Stackra file contract:
 * Purpose: the "content" demo of the web Popover: A title names the popover for a screen reader. Without one,
 *          aria-label does. The arrow ties the popover to its trigger, and the content can be a form.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL); WCAG 2.2 SC 2.1.2 and 2.5.8.
 */
import { Button, Popover as UiPopover, Text, TextField, useCatalogueText } from "@stackra/ui/react";
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

/** The Popover demo: content. */
export default function Content() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className={ROW}>
      <li>
        <UiPopover
          title={t(K.titled_title)}
          className={SURFACE}
          trigger={<Button variant="secondary">{t(K.titled)}</Button>}
        >
          <Body>{t(K.titled_body)}</Body>
        </UiPopover>
      </li>
      <li>
        <UiPopover
          hasArrow
          title={t(K.arrow_title)}
          className={SURFACE}
          trigger={<Button variant="secondary">{t(K.arrow)}</Button>}
        >
          <Body>{t(K.arrow_body)}</Body>
        </UiPopover>
      </li>
      <li>
        <UiPopover
          aria-label={t(K.named_label)}
          className={SURFACE}
          trigger={<Button variant="secondary">{t(K.named)}</Button>}
        >
          <Body>{t(K.named_body)}</Body>
        </UiPopover>
      </li>
      <li>
        <UiPopover
          title={t(K.form_title)}
          className={SURFACE}
          trigger={<Button variant="secondary">{t(K.form)}</Button>}
        >
          <div className="grid gap-3">
            <TextField label={t(K.form_field)} defaultValue="Spring order" />
            <div>
              <Button size="sm">{t(K.form_save)}</Button>
            </div>
          </div>
        </UiPopover>
      </li>
    </ul>
  );
}
