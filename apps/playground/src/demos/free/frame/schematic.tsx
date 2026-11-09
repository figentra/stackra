/**
 * Stackra file contract:
 * Purpose: the "schematic" demo of the web Frame: one action file in a schematic window, the part a blueprint
 *          machine pipes into its surfaces.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown. The code and
 *           the file name are code, never translated.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); ADR 0501 (section 9, the blueprint roles); STA-2041.
 */
import { CodeBlock, Frame } from "@stackra/ui/react";

/** The action in the window (code, never translated). */
const CODE = `export class CancelSubscriptionAction extends Action({
  key: "subscription.cancel",
  actors: [ActorKind.User, ActorKind.Agent],
}) {
  /** Cancels at the period's end, so the paid days stay. */
  async handle(input: CancelSubscriptionInput, ctx: ActionContext) {
    return this.subscriptions.cancelAtPeriodEnd(input.subscriptionId, ctx);
  }
}`;

/** Frame: a schematic window around an action file. */
export default function Schematic() {
  return (
    <Frame variant="schematic" title="cancel-subscription.action.ts" className="w-full max-w-xl">
      <CodeBlock code={CODE} language="ts" isCopyable={false} />
    </Frame>
  );
}
