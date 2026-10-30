/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web TaskTray: "Export orders" starts an export that fills its bar and finishes;
 *          "Import customers" starts one that fails part way and can be tried again; tasks can be cancelled, removed
 *          or cleared, and the tray folds to its header.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           The tray sits in the flow (`placement="inline"`) so it stays inside the preview; an app leaves it docked.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (owner request 2026-10-29).
 */
import type { TaskTrayTask } from "@stackra/ui/contracts";
import { Button, TaskTray, useCatalogueText } from "@stackra/ui/react";
import { useEffect, useState } from "react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { TASK_TRAY_KEYS } from "#src/demos/free/task-tray/task-tray-keys.constant";

/** The demo's keys. */
const K = TASK_TRAY_KEYS.task_tray;

/** The rows of the fake import. */
const ROWS = 400;

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

  // The import's line of detail: the rows read while it runs, the reason once it fails.
  const shown = tasks.map((task): TaskTrayTask => {
    if (!task.id.startsWith("import")) return task;
    if (task.status === "error") return { ...task, detail: t(K.no_phone) };
    if (task.status !== "running") return task;
    const done = Math.round(((task.progress ?? 0) / 100) * ROWS);
    return { ...task, detail: t(K.rows, { done, total: ROWS }) };
  });

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
    <div className="grid w-full max-w-md gap-4">
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onPress={() => start("export")}>
          {t(K.start)}
        </Button>
        <Button variant="secondary" onPress={() => start("import")}>
          {t(K.fail)}
        </Button>
      </div>
      <TaskTray
        placement="inline"
        tasks={shown}
        onCancel={(id) => update(id, { status: "canceled" })}
        onRetry={(id) => update(id, { status: "running", progress: 0 })}
        onDismiss={(id) => setTasks((all) => all.filter((task) => task.id !== id))}
        onClear={() =>
          setTasks((all) =>
            all.filter((task) => task.status === "queued" || task.status === "running"),
          )
        }
      />
    </div>
  );
}
