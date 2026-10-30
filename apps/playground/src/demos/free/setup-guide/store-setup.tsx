/**
 * Stackra file contract:
 * Purpose: the "store-setup" demo of the web SetupGuide: an online store's first steps, ticked by the page; each open task has its call to action, and the list folds once all four are done.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL); design-system gap inventory row 17.
 */
import { SetupGuide as UiSetupGuide, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SETUP_GUIDE_KEYS } from "#src/demos/free/setup-guide/setup-guide-keys.constant";

/** The demo's keys. */
const K = SETUP_GUIDE_KEYS.setup_guide;

/** The store's tasks. */
type TaskId = "product" | "payments" | "shipping" | "domain";

/** SetupGuide: Store setup. */
export default function StoreSetup() {
  const t = useCatalogueText(MESSAGES.en);
  const [done, setDone] = useState<readonly string[]>(["product"]);
  const [opened, setOpened] = useState<TaskId | undefined>();
  const tick = (id: string, isComplete: boolean) =>
    setDone((ids) => (isComplete ? [...ids, id] : ids.filter((other) => other !== id)));
  const task = (id: TaskId, hint?: string) => ({
    id,
    title: t(K.task[id]),
    description: hint,
    isComplete: done.includes(id),
    actionLabel: t(K.task[`${id}_action`]),
    onAction: () => setOpened(id),
  });

  return (
    <div className="grid gap-3">
      <UiSetupGuide
        title={t(K.store.title)}
        description={t(K.store.description)}
        tasks={[
          task("product", t(K.task.product_hint)),
          task("payments", t(K.task.payments_hint)),
          task("shipping"),
          task("domain"),
        ]}
        onCompleteChange={tick}
      />
      <Text type="small" tone="muted" aria-live="polite">
        {opened ? t(K.opened[opened]) : ""}
      </Text>
    </div>
  );
}
