/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native TaskTray: one task in each state (running with a known share, running with
 *          an unknown one, queued, failed with its reason, done and cancelled); pressing a button takes it off the list.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           The tray sits in the flow (`placement="inline"`) so it stays inside the preview; an app leaves it docked.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (owner request 2026-10-29).
 */
import type { TaskTrayTask } from "@stackra/ui/contracts";
import { TaskTray, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { TASK_TRAY_DEMO_KEYS } from "#src/demos/free/task-tray/task-tray-demo-keys.constant";

/** The demo's keys. */
const K = TASK_TRAY_DEMO_KEYS.demo_free.task_tray;

/** TaskTray: every state. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const [removed, setRemoved] = useState<readonly string[]>([]);
  const tasks: readonly TaskTrayTask[] = [
    { id: "export", label: t(K.export), status: "running", progress: 64, icon: Icons.Download },
    { id: "sync", label: t(K.upload), status: "running", icon: Icons.Upload },
    { id: "queued", label: t(K.export), status: "queued", icon: Icons.Download },
    { id: "import", label: t(K.import), status: "error", detail: t(K.no_phone) },
    { id: "done", label: t(K.upload), status: "done" },
    { id: "canceled", label: t(K.import), status: "canceled" },
  ];
  const remove = (id: string) => setRemoved((ids) => [...ids, id]);
  return (
    <TaskTray
      placement="inline"
      tasks={tasks.filter((task) => !removed.includes(task.id))}
      onCancel={remove}
      onRetry={remove}
      onDismiss={remove}
    />
  );
}
