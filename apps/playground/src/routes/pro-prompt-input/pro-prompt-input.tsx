/**
 * Stackra file contract:
 * Purpose: the page of the PromptInput route: `@stackra/ui-pro`'s PromptInput as a composer whose text area, attach
 *          button and send button carry names, which sends the message into a list below it, and as a composer that is
 *          waiting for a reply, whose button stops the reply instead of sending.
 * Boundary: presentation only; nothing is sent anywhere. Sending adds the text to a local list and empties the field.
 *          The icon-only buttons carry names; the hint under the composer is text.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra/ui-pro/react";
import { useState } from "react";

import { DemoIcon } from "#src/components/demo-icon";
import { ProPromptInputRoute } from "#src/routes/pro-prompt-input/pro-prompt-input.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-prompt-input.*` keys.
const STRINGS = {
  documentTitle: `${ProPromptInputRoute.title} · Stackra Playground`,
  intro:
    "A message composer: a text area that grows, a toolbar for actions and a button that sends with Enter. While a reply is on its way, the button stops it instead.",
  composer: "Composer",
  messageLabel: "Message",
  placeholder: "What do you want to know?",
  attach: "Attach file",
  send: "Send message",
  hint: "The assistant can make mistakes. Check important information.",
  sent: "Sent messages",
  nothing: "Nothing sent yet.",
  running: "Waiting for a reply",
  runningLabel: "Message, waiting for a reply",
  runningText: "Summarise this meeting transcript into action items",
  stop: "Stop the reply",
  stopped: "The reply was stopped.",
} as const;

/** The PromptInput page. */
export function ProPromptInput() {
  const [value, setValue] = useState("");
  const [sent, setSent] = useState<readonly string[]>([]);
  const [isStopped, setIsStopped] = useState(false);

  const submit = () => {
    const text = value.trim();
    if (text === "") return;
    setSent((current) => [...current, text]);
    setValue("");
  };

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProPromptInputRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="composer-heading" className="grid max-w-2xl gap-3">
        <h2 id="composer-heading" className="type-h2">
          {STRINGS.composer}
        </h2>
        <UiPro.PromptInput value={value} onSubmit={submit} onValueChange={setValue}>
          <UiPro.PromptInput.Shell>
            <UiPro.PromptInput.Content>
              <UiPro.PromptInput.TextArea
                label={STRINGS.messageLabel}
                placeholder={STRINGS.placeholder}
              />
            </UiPro.PromptInput.Content>
            <UiPro.PromptInput.Toolbar>
              <UiPro.PromptInput.ToolbarStart>
                <UiPro.PromptInput.Action label={STRINGS.attach}>
                  <DemoIcon name="doc" />
                </UiPro.PromptInput.Action>
              </UiPro.PromptInput.ToolbarStart>
              <UiPro.PromptInput.ToolbarEnd>
                <UiPro.PromptInput.Send label={STRINGS.send} />
              </UiPro.PromptInput.ToolbarEnd>
            </UiPro.PromptInput.Toolbar>
          </UiPro.PromptInput.Shell>
          <UiPro.PromptInput.Footer>{STRINGS.hint}</UiPro.PromptInput.Footer>
        </UiPro.PromptInput>
        <h3 className="type-h3">{STRINGS.sent}</h3>
        <ul className="grid gap-1 text-sm" aria-live="polite">
          {sent.length === 0 ? (
            <li className="text-muted">{STRINGS.nothing}</li>
          ) : (
            sent.map((text, index) => (
              <li key={`${index}-${text}`}>
                <bdi>{text}</bdi>
              </li>
            ))
          )}
        </ul>
      </section>
      <section aria-labelledby="running-heading" className="grid max-w-2xl gap-3">
        <h2 id="running-heading" className="type-h2">
          {STRINGS.running}
        </h2>
        <UiPro.PromptInput
          value={STRINGS.runningText}
          status={isStopped ? "ready" : "streaming"}
          onStop={() => setIsStopped(true)}
        >
          <UiPro.PromptInput.Shell>
            <UiPro.PromptInput.Content>
              <UiPro.PromptInput.TextArea label={STRINGS.runningLabel} />
            </UiPro.PromptInput.Content>
            <UiPro.PromptInput.Toolbar>
              <UiPro.PromptInput.ToolbarEnd>
                <UiPro.PromptInput.Send label={isStopped ? STRINGS.send : STRINGS.stop} />
              </UiPro.PromptInput.ToolbarEnd>
            </UiPro.PromptInput.Toolbar>
          </UiPro.PromptInput.Shell>
        </UiPro.PromptInput>
        <p className="text-sm" role="status">
          {isStopped ? STRINGS.stopped : null}
        </p>
      </section>
    </article>
  );
}
