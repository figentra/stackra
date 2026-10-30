/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Floating action button: one main action floating at the reading end of an
 *          area. Pressing "New order" opens a small new-order drawer; Create closes it, counts the order and says so in
 *          the area ("Order #1043 created"), announced politely.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           shortcut: the confirmation is a polite status line, not a toast, because the page mounts no ToastProvider
 *           and a demo-mounted one would show each toast twice (the Usage copy and the Arabic preview); switch to
 *           `toast.success` once the shell mounts one provider.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); owner feedback 2026-10-29 (STA-1371).
 */
import { Button, Drawer, Fab, Text, TextField, useCatalogueText } from "@stackra/ui/react";
import { type ReactElement, useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { FAB_KEYS } from "#src/demos/free/fab/fab-keys.constant";

/** The demo's keys. */
const K = FAB_KEYS.fab;

/** The number the first order takes. */
const FIRST_ORDER = 1043;

/** Floating action button: Basics. */
export default function Basics(): ReactElement {
  const t = useCatalogueText(MESSAGES.en);
  const [count, setCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const next = FIRST_ORDER + count;
  return (
    <div className="relative grid h-56 w-full content-start gap-1 rounded-2xl border border-dashed border-border p-4">
      <Text type="small" tone="muted">
        {t(K.area)} · {count}
      </Text>
      <output aria-live="polite">
        <Text type="small">
          <bdi>{count > 0 ? t(K.created, { number: next - 1 }) : t(K.nothing_yet)}</bdi>
        </Text>
      </output>
      <Fab label={t(K.new_order)} isExtended onPress={() => setIsOpen(true)} />
      <Drawer isOpen={isOpen} onOpenChange={setIsOpen} size="sm">
        <Drawer.Header>
          <Drawer.Title>{t(K.order_title, { number: next })}</Drawer.Title>
          <Drawer.Close label={t(K.close)} />
        </Drawer.Header>
        <Drawer.Body>
          <TextField label={t(K.customer)} defaultValue={t(K.customer_value)} />
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="secondary" slot="close">
            {t(K.cancel)}
          </Button>
          <Button
            onPress={() => {
              setCount((value) => value + 1);
              setIsOpen(false);
            }}
          >
            {t(K.create)}
          </Button>
        </Drawer.Footer>
      </Drawer>
    </div>
  );
}
