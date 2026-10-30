/**
 * Stackra file contract:
 * Purpose: the "options" demo of the web Toast: A description, one action, a toast that stays until dismissed, and an
 *          icon of your own or none.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0312 (decisions 1 to 3); WCAG 2.2 SC 4.1.3 and 2.2.1; ADR 0060 (light, dark, RTL).
 */
import { Button, toast, useCatalogueText } from "@stackra/ui/react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { TOAST_KEYS } from "#src/demos/free/toast/toast-keys.constant";

/** The demo's keys. */
const K = TOAST_KEYS.toast;

/** The row that lays buttons out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** The Toast demo: options. */
export default function Options() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={ROW}>
      <Button
        variant="secondary"
        onPress={() =>
          toast(t(K.message.saved), {
            tone: "success",
            description: t(K.message.profile),
          })
        }
      >
        {t(K.with_description)}
      </Button>
      <Button
        variant="secondary"
        onPress={() =>
          toast(t(K.message.deleted), {
            action: {
              label: t(K.message.undo),
              onPress: () => toast.success(t(K.message.restored)),
            },
          })
        }
      >
        {t(K.with_action)}
      </Button>
      <Button
        variant="secondary"
        onPress={() => toast(t(K.message.paused), { tone: "warning", timeout: 0 })}
      >
        {t(K.staying)}
      </Button>
      <Button
        variant="secondary"
        onPress={() => toast(t(K.message.copied), { tone: "accent", icon: Icons.CircleCheck })}
      >
        {t(K.own_icon)}
      </Button>
      <Button variant="secondary" onPress={() => toast(t(K.message.copied), { icon: false })}>
        {t(K.no_icon)}
      </Button>
    </div>
  );
}
