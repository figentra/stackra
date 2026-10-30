/**
 * Stackra file contract:
 * Purpose: the "control" demo of the web Toast, a live playground: pick the look (alert, bar, flip bar, bubble), the
 *          place along the edge (start, centre, end, full width) and the edge (bottom or top), then show four toasts to
 *          see them stack: hover the stack to spread it, swipe a toast sideways to dismiss it, or dismiss them all.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0312 (decisions 1 to 3); WCAG 2.2 SC 4.1.3 and 2.2.1; ADR 0060 (light, dark, RTL).
 */
import type { ToastAlign, ToastVariant } from "@stackra/ui/contracts";
import {
  Button,
  RadioGroup,
  Switch,
  ToastProvider,
  toast,
  useCatalogueText,
} from "@stackra/ui/react";
import { useEffect, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TOAST_KEYS } from "#src/demos/free/toast/toast-keys.constant";

/** The demo's keys. */
const K = TOAST_KEYS.toast;

/** The row that lays buttons out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** The looks, each with its catalogue key. */
const LOOKS = [
  ["alert", "alert"],
  ["bar", "bar"],
  ["flip-bar", "flip_bar"],
  ["bubble", "bubble"],
] as const;

/** The places along the edge. */
const ALIGNS = ["start", "center", "end", "full"] as const;

/** Toast: Styles and position. */
export default function Control() {
  const t = useCatalogueText(MESSAGES.en);
  const [isTop, setIsTop] = useState(false);
  const [look, setLook] = useState<ToastVariant>("alert");
  const [align, setAlign] = useState<ToastAlign>("center");
  // The queue is global, so a toast shown here would still be waiting when the reader came back to this page.
  useEffect(() => () => toast.clear(), []);

  return (
    <div className="grid gap-4">
      {/* shortcut: this demo mounts the page’s one provider, so the other toast demos show through it; move it to the shell once the shell mounts a ToastProvider. */}
      <ToastProvider
        dismissLabel={t(K.dismiss_label)}
        position={isTop ? "top" : "bottom"}
        align={align}
        variant={look}
      />
      <RadioGroup
        label={t(K.look_label)}
        orientation="horizontal"
        value={look}
        onChange={(next) => setLook(next as ToastVariant)}
        options={LOOKS.map(([value, key]) => ({ value, label: t(K.looks[key]) }))}
      />
      <RadioGroup
        label={t(K.align_label)}
        orientation="horizontal"
        value={align}
        onChange={(next) => setAlign(next as ToastAlign)}
        options={ALIGNS.map((value) => ({ value, label: t(K.aligns[value]) }))}
      />
      <div className={ROW}>
        <Switch label={t(K.at_top)} value={isTop} onChange={setIsTop} />
        <Button
          variant="secondary"
          onPress={() => {
            toast.success(t(K.message.saved_short));
            toast.info(t(K.message.syncing));
            toast.warning(t(K.message.offline));
            toast(t(K.message.mention), { avatar: { name: t(K.message.person) } });
          }}
        >
          {t(K.stack)}
        </Button>
        <Button variant="ghost" onPress={() => toast.clear()}>
          {t(K.clear)}
        </Button>
      </div>
    </div>
  );
}
