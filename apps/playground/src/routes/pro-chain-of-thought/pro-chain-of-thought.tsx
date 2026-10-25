/**
 * Stackra file contract:
 * Purpose: the page of the ChainOfThought route: `@stackra-pro/ui`'s ChainOfThought as a finished, collapsed trace
 *          ("Thought for 4 seconds", opened by its trigger) and as a trace still streaming (an open list of steps under a
 *          shimmering "Thinking" trigger).
 * Boundary: presentation only; the steps are local. The trigger is a real button that reports its expanded state.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra-pro/ui/react";

import { ProChainOfThoughtRoute } from "#src/routes/pro-chain-of-thought/pro-chain-of-thought.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-chain-of-thought.*` keys.
const STRINGS = {
  documentTitle: `${ProChainOfThoughtRoute.title} · Stackra Playground`,
  intro:
    "A collapsible trace of what an assistant did before it answered: press the trigger to open or close the steps. While the assistant is still working, the trigger shimmers.",
  done: "Finished",
  doneTrigger: "Thought for 4 seconds",
  streaming: "Still thinking",
  streamingTrigger: "Thinking...",
} as const;

const DONE_STEPS = [
  {
    label: "Search",
    text: "Looked up the chat template patterns for message layout and composer spacing.",
  },
  { label: "Plan", text: "Mapped the template structure to components that name no AI SDK." },
] as const;

const STREAMING_STEPS = [
  { label: "Analyze", text: "Breaking the request into presentation-only components." },
] as const;

/** The ChainOfThought page. */
export function ProChainOfThought() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProChainOfThoughtRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="done-heading" className="grid max-w-xl gap-3">
        <h2 id="done-heading" className="type-h2">
          {STRINGS.done}
        </h2>
        <UiPro.ChainOfThought defaultExpanded={false}>
          <UiPro.ChainOfThought.Trigger>{STRINGS.doneTrigger}</UiPro.ChainOfThought.Trigger>
          <UiPro.ChainOfThought.Content>
            <UiPro.ChainOfThought.Steps>
              {DONE_STEPS.map((step) => (
                <UiPro.ChainOfThought.Step key={step.label} label={step.label}>
                  <bdi>{step.text}</bdi>
                </UiPro.ChainOfThought.Step>
              ))}
            </UiPro.ChainOfThought.Steps>
          </UiPro.ChainOfThought.Content>
        </UiPro.ChainOfThought>
      </section>
      <section aria-labelledby="streaming-heading" className="grid max-w-xl gap-3">
        <h2 id="streaming-heading" className="type-h2">
          {STRINGS.streaming}
        </h2>
        <UiPro.ChainOfThought isExpanded isStreaming>
          <UiPro.ChainOfThought.Trigger>{STRINGS.streamingTrigger}</UiPro.ChainOfThought.Trigger>
          <UiPro.ChainOfThought.Content>
            <UiPro.ChainOfThought.Steps>
              {STREAMING_STEPS.map((step) => (
                <UiPro.ChainOfThought.Step key={step.label} label={step.label}>
                  <bdi>{step.text}</bdi>
                </UiPro.ChainOfThought.Step>
              ))}
            </UiPro.ChainOfThought.Steps>
          </UiPro.ChainOfThought.Content>
        </UiPro.ChainOfThought>
      </section>
    </article>
  );
}
