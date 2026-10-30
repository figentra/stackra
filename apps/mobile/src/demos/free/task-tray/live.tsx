/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native TaskTray: "Export orders" starts an export that fills its bar and finishes;
 *          "Import customers" starts one that fails part way and can be tried again; tasks can be cancelled, removed
 *          or cleared, and the tray folds to its header.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           The tray sits in the flow (`placement="inline"`) so it stays inside the preview; an app leaves it docked.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (owner request 2026-10-29).
 */
import type { TaskTrayTask } from "@stackra/ui/contracts";
import { Button, TaskTray, useCatalogueText } from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { TASK_TRAY_DEMO_KEYS } from "#src/demos/free/task-tray/task-tray-demo-keys.constant";

/** The demo's keys. */
const K = TASK_TRAY_DEMO_KEYS.demo_free.task_tray;

/** TaskTray: try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [tasks, setTasks] = useState<readonly TaskTrayTask[]>([]);
  const update = (id: string, change: Partial<TaskTrayTask>) =>
    setTasks((all) => all.map((task) => (task.id === id ? { ...task, ...change } : task)));

  // Moves every running task on by 8%, every 400 ms; the import fails at 60%.
  useEffect(() => {
    const timer = setInterval(() => {
      setTasks((all) =>
        all.map((task) => {
          if (task.status !== "running") return task;
          const progress = Math.min(100, (task.progress ?? 0) + 8);
          if (task.id.startsWith("import") && progress >= 60)
            return { ...task, status: "error", progress };
          return { ...task, progress, status: progress >= 100 ? "done" : "running" };
        }),
      );
    }, 400);
    return () => clearInterval(timer);
  }, []);

  const start = (kind: "export" | "import") =>
    setTasks((all) => [
      {
        id: `${kind}-${Date.now()}`,
        label: t(kind === "export" ? K.export : K.import),
        status: "running",
        progress: 0,
        icon: kind === "export" ? Icons.Download : Icons.Upload,
      },
      ...all,
    ]);

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap gap-3">
        <Button size="sm" variant="secondary" onPress={() => start("export")}>
          {t(K.start)}
        </Button>
        <Button size="sm" variant="secondary" onPress={() => start("import")}>
          {t(K.fail)}
        </Button>
      </View>
      <TaskTray
        placement="inline"
        tasks={tasks.map((task) =>
          task.status === "error" ? { ...task, detail: t(K.no_phone) } : task,
        )}
        onCancel={(id) => update(id, { status: "canceled" })}
        onRetry={(id) => update(id, { status: "running", progress: 0 })}
        onDismiss={(id) => setTasks((all) => all.filter((task) => task.id !== id))}
        onClear={() =>
          setTasks((all) =>
            all.filter((task) => task.status === "queued" || task.status === "running"),
          )
        }
      />
    </View>
  );
}
