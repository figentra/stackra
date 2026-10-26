/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `PlanView` (@stackra-pro/ui): an agent's restock plan with one
 *          step in each status, the status words from the ui-pro catalogue, and the approve and reject actions.
 * Boundary: presentation only; the actions do nothing.
 * Runtime: react-native
 * Governing contract: ADR 0245 (decision 8); ADR 0310 (decision 6); STA-803.
 */
import { PlanView } from "@stackra-pro/ui/native";
import { Button } from "@stackra/ui/native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  title: "Plan",
  description:
    "Each step's status is a marker tint and a word under the title, never colour alone.",
  label: "Plan to restock low items",
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

/** The PlanView page. */
export function PlanViewScreen() {
  return (
    <Screen>
      <Section title={STRINGS.title} description={STRINGS.description}>
        <PlanView
          label={STRINGS.label}
          steps={STRINGS.steps}
          actions={
            <>
              <Button>{STRINGS.approve}</Button>
              <Button variant="ghost">{STRINGS.reject}</Button>
            </>
          }
        />
      </Section>
    </Screen>
  );
}
