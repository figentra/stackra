/**
 * Stackra file contract:
 * Purpose: `createMockTamoClient`, a deterministic offline `TamoClient` for the playground and tests: every task answered by
 *          plain rules (no keys, no network) after a short delay, abortable, with chosen tasks failing on purpose.
 * Boundary: demo only. The same input gives the same output; Stop rejects with an `AbortError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (a deterministic mock provider, offline, no keys).
 */
import type { TamoTasks } from "@stackra/ui/contracts";

import { mockTamoContinue } from "#react/tamo/mock-tamo-continue.function";
import { mockTamoDraft } from "#react/tamo/mock-tamo-draft.function";
import { mockTamoText } from "#react/tamo/mock-tamo-text.function";
import { mockTamoDate } from "#react/tamo/mock-tamo-date.function";
import { mockTamoFilter } from "#react/tamo/mock-tamo-filter.function";
import { mockTamoForm } from "#react/tamo/mock-tamo-form.function";
import type { MockTamoClientOptions } from "#react/tamo/mock-tamo-client-options.type";
import type { TamoClient } from "#react/tamo/tamo-client.type";
import type { TamoRunContext } from "#react/tamo/tamo-run-context.type";

/** Waits, or rejects as aborted when `signal` aborts first. */
function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const aborted = () => reject(new DOMException("Tamo stopped", "AbortError"));
    if (signal.aborted) {
      aborted();
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      aborted();
    });
  });
}

/** The mock answer of one task. */
function answer(
  task: keyof TamoTasks,
  input: TamoTasks[keyof TamoTasks]["input"],
  context: TamoRunContext,
): unknown {
  switch (task) {
    case "transform": {
      const { action, text } = input as TamoTasks["transform"]["input"];
      return mockTamoText(action, text);
    }
    case "continue": {
      return mockTamoContinue((input as TamoTasks["continue"]["input"]).text);
    }
    case "draft": {
      const { prompt, locale } = input as TamoTasks["draft"]["input"];
      return mockTamoDraft(prompt, locale);
    }
    case "filter": {
      return mockTamoFilter(input as TamoTasks["filter"]["input"]);
    }
    case "date": {
      return mockTamoDate(input as TamoTasks["date"]["input"]);
    }
    case "fill_form": {
      return mockTamoForm(input as TamoTasks["fill_form"]["input"]);
    }
    case "summarise": {
      const { rows, locale } = input as TamoTasks["summarise"]["input"];
      const columns = Object.keys(rows[0] ?? {});
      const numeric = columns.find((column) =>
        rows.every(
          (row) =>
            /^[\d.,\s]+$/u.test(row[column]?.replaceAll(/[^\d.,\s]/gu, "") ?? "") &&
            /\d/u.test(row[column] ?? ""),
        ),
      );
      const total = numeric
        ? rows.reduce(
            (sum, row) => sum + Number((row[numeric] ?? "0").replaceAll(/[^\d.]/gu, "")),
            0,
          )
        : undefined;
      const first = columns[0] ?? "";
      const names = rows
        .map((row) => row[first])
        .filter(Boolean)
        .slice(0, 3)
        .join(", ");
      return locale.startsWith("ar")
        ? `${rows.length} صفوف محددة: ${names}${rows.length > 3 ? "…" : ""}.${total === undefined ? "" : ` مجموع ${numeric}: ${total.toLocaleString("ar")}.`}`
        : `${rows.length} selected rows: ${names}${rows.length > 3 ? "…" : ""}.${total === undefined ? "" : ` Total ${numeric}: ${total.toLocaleString("en")}.`}`;
    }
    case "fill_column": {
      const { instruction, rows } = input as TamoTasks["fill_column"]["input"];
      return Object.fromEntries(
        rows.map((row) => {
          const first = Object.values(row.values)[0] ?? row.id;
          const value = /thank|شكر/iu.test(instruction)
            ? `Thank you, ${first}!`
            : /upper|كبير/iu.test(instruction)
              ? first.toUpperCase()
              : `${instruction.trim()}: ${first}`;
          return [row.id, value];
        }),
      );
    }
    case "ask": {
      const { question, locale } = input as TamoTasks["ask"]["input"];
      const screen = context.screen ?? (locale.startsWith("ar") ? "هذه الشاشة" : "this screen");
      return locale.startsWith("ar")
        ? `أنت في ${screen}. هذه مسودة إجابة عن «${question}»: راجع الأرقام في الجدول، وسأقترح الخطوة التالية عندما تحدد السجلات.`
        : `You're on ${screen}. A draft answer to "${question}": check the figures in the table; select records and I'll suggest the next step.`;
    }
    default: {
      return null;
    }
  }
}

/**
 * The offline Tamo client.
 *
 * @example
 * <TamoProvider client={createMockTamoClient()} screen="orders" screenLabel="Orders">…</TamoProvider>
 */
export function createMockTamoClient(options: MockTamoClientOptions = {}): TamoClient {
  const { delayMs = 700, failing = [] } = options;
  return {
    run: async (task, input, signal, context) => {
      await wait(delayMs, signal);
      if (failing.includes(task)) throw new Error(`Tamo mock: ${task} fails on purpose`);
      return answer(task, input, context) as never;
    },
  };
}
