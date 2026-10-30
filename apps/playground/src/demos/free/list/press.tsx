/**
 * Stackra file contract:
 * Purpose: the "press" demo of the web List: A row with a press action is a button. A disabled one is dimmed and
 *          refuses the press. A row without a press action is plain content.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313; ADR 0060 (light, dark, RTL).
 */
import { List as UiList, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { LIST_KEYS } from "#src/demos/free/list/list-keys.constant";

/** The demo's keys. */
const K = LIST_KEYS.list;

/** List: Pressable rows. */
export default function Press() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <UiList
        label={t(K.press_label)}
        items={[
          {
            id: "profile",
            title: t(K.sample.profile),
            startIcon: "settings",
            hasChevron: true,
            onPress: () => undefined,
          },
          {
            id: "billing",
            title: t(K.sample.billing),
            description: t(K.sample.plans_and_invoices),
            hasChevron: true,
            onPress: () => undefined,
          },
        ]}
      />
      <UiList
        label={t(K.disabled_label)}
        items={[
          {
            id: "profile",
            title: t(K.sample.profile_disabled),
            onPress: () => undefined,
            isDisabled: true,
          },
          {
            id: "billing",
            title: t(K.sample.billing_disabled),
            hasChevron: true,
            onPress: () => undefined,
            isDisabled: true,
          },
        ]}
      />
    </div>
  );
}
