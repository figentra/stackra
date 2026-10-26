/**
 * Stackra file contract:
 * Purpose: the page of the Plan view route: `@stackra-pro/ui`'s PlanView as an agent's restock plan in five steps,
 *          one in each status, with the status words from the ui-pro catalogue, and the approve and reject actions.
 * Boundary: presentation only; the plan is local and the actions do nothing.
 * Runtime: browser
 * Governing contract: ADR 0245 (decision 8); ADR 0310 (decision 12); WCAG 2.2 SC 1.4.1; STA-803.
 */
import * as Ui from "@stackra/ui/react";
import * as UiPro from "@stackra-pro/ui/react";

import { ProPlanViewRoute } from "#src/routes/pro-plan-view/pro-plan-view.route";

// shortcut: English strings in one place until the playground reads `playground::*` keys (STA-788).
const STRINGS = {
  documentTitle: `${ProPlanViewRoute.title} · Stackra Playground`,
  intro:
    "An agent's plan, step by step. Each step's status is a marker colour and a word read with it, never colour alone.",
  plan: "Plan to restock low items",
  approve: "Approve plan",
  reject: "Reject",
  steps: [
    { id: "find", title: "Find items below their reorder level", status: "done" },
    { id: "draft", title: "Draft purchase orders", status: "running", detail: "3 suppliers" },
    { id: "email", title: "Email the suppliers", status: "pending" },
    {
      id: "price",
      title: "Check last month's prices",
      status: "failed",
      detail: "The price list is empty.",
    },
    { id: "notify", title: "Notify the store manager", status: "skipped" },
  ],
} as const;

/** The Plan view page. */
export function ProPlanView() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProPlanViewRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <div className="max-w-xl">
        <UiPro.PlanView
          label={STRINGS.plan}
          steps={STRINGS.steps}
          actions={
            <>
              <Ui.Button>{STRINGS.approve}</Ui.Button>
              <Ui.Button variant="ghost">{STRINGS.reject}</Ui.Button>
            </>
          }
        />
      </div>
    </article>
  );
}
