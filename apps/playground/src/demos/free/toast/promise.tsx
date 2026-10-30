/**
 * Stackra file contract:
 * Purpose: the "promise" demo of the web Toast: two buttons start a two-second save, one that succeeds and one that
 *          fails; one toast follows each from a spinner to the result, in place.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0312; WCAG 2.2 SC 4.1.3;
 *          ADR 0060 (light, dark, RTL); STA-1371 (owner request 2026-10-29).
 */
import { Button, toast, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TOAST_KEYS } from "#src/demos/free/toast/toast-keys.constant";

/** The demo's keys. */
const K = TOAST_KEYS.toast.promise;

/** A save that settles after two seconds. */
const save = (isOk: boolean) =>
  new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      if (isOk) resolve();
      else reject(new Error("offline"));
    }, 2000);
  });

/** Toast: following a promise. */
export default function FollowsPromise() {
  const t = useCatalogueText(MESSAGES.en);
  const run = (isOk: boolean) =>
    toast.promise(() => save(isOk), {
      loading: t(K.loading),
      success: t(K.success),
      error: t(K.error),
    });
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="secondary" onPress={() => run(true)}>
        {t(K.save)}
      </Button>
      <Button variant="secondary" onPress={() => run(false)}>
        {t(K.fail)}
      </Button>
    </div>
  );
}
