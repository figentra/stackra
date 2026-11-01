/**
 * Stackra file contract:
 * Purpose: the web `TamoPanel`: the Ask Tamo side panel (the house Drawer at the inline end): Tamo's mark, the screen
 *          it is on, the questions and answers (each answer marked as Tamo's, a failed one with Try again), the
 *          composer with Stop, and a disclaimer. Opened with a question (from the command palette), it asks it.
 * Boundary: the open state is the slot's (`panel`); the AI module's provider draws it once. Answers are text Tamo
 *           drafts; nothing on the screen changes from here (ADR 0021).
 * Runtime: browser
 * Governing contract: ADR 0507 (the Ask Tamo side panel that knows the screen); ADR 0490 (page context); WCAG 2.2 SC
 *          2.1.1, 2.4.3, 4.1.3.
 */
import { cn } from "@heroui/react";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { useLocale } from "react-aria-components";

import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { ChatMessage } from "#react/chat-message/chat-message";
import { Drawer } from "#react/drawer/drawer";
import { useTamo } from "#react/hooks/use-tamo";
import { useUiText } from "#react/hooks/use-ui-text";
import { PromptInput } from "#react/prompt-input/prompt-input";
import { TamoMark } from "#react/tamo-mark/tamo-mark";
import { TamoMarker } from "#react/tamo-marker/tamo-marker";
import { TamoStatusLine } from "#react/tamo-status-line/tamo-status-line";
import type { TamoPanelProps } from "#react/tamo-panel/tamo-panel.props";

/** K: the Tamo words. */
const K = TAMO_KEYS.ui.tamo;

/** One turn of the panel. */
interface Turn {
  readonly id: number;
  readonly question: string;
  readonly answer?: string | undefined;
  readonly isFailed?: boolean | undefined;
}

/** The Ask Tamo panel. */
export function TamoPanel({ className }: TamoPanelProps): ReactElement | null {
  const t = useUiText();
  const { locale } = useLocale();
  const tamo = useTamo();
  const [turns, setTurns] = useState<readonly Turn[]>([]);
  const controller = useRef<AbortController | null>(null);
  const asked = useRef<string | undefined>(undefined);
  const isWorking = turns.some((turn) => turn.answer === undefined && !turn.isFailed);

  const ask = (question: string) => {
    if (!tamo) return;
    controller.current?.abort();
    const own = new AbortController();
    controller.current = own;
    const id = turns.length + 1 + Math.random();
    setTurns((all) => [...all, { id, question }]);
    tamo.run("ask", { question, locale }, own.signal).then(
      (answer) =>
        setTurns((all) => all.map((turn) => (turn.id === id ? { ...turn, answer } : turn))),
      () => {
        if (!own.signal.aborted)
          setTurns((all) =>
            all.map((turn) => (turn.id === id ? { ...turn, isFailed: true } : turn)),
          );
      },
    );
  };
  const stop = () => {
    controller.current?.abort();
    setTurns((all) => all.filter((turn) => turn.answer !== undefined || turn.isFailed));
  };

  // A question handed over by another part (the command palette) is asked once, as the panel opens with it.
  const question = tamo?.panel.isOpen ? tamo.panel.question : undefined;
  useEffect(() => {
    if (question && question !== asked.current) ask(question);
    asked.current = question;
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reason: only a new handed-over question asks
  }, [question]);

  if (!tamo) return null;
  const name = t(K.ask);
  return (
    <Drawer
      placement="end"
      size="sm"
      isOpen={tamo.panel.isOpen}
      onOpenChange={(isOpen) => (isOpen ? tamo.panel.open() : tamo.panel.close())}
    >
      <Drawer.Header>
        <Drawer.Title>
          <span className="inline-flex items-center gap-2">
            <TamoMark size="md" status={isWorking ? "working" : "idle"} />
            {name}
          </span>
        </Drawer.Title>
        {tamo.screenLabel ? (
          <Drawer.Description>
            {t(K.panel_context, { screen: tamo.screenLabel })}
          </Drawer.Description>
        ) : null}
      </Drawer.Header>
      <Drawer.Body>
        <div
          role="log"
          aria-label={name}
          className={cn("grid content-start gap-4", className) ?? ""}
        >
          {turns.length === 0 ? <p className="m-0 text-sm text-muted">{t(K.panel_empty)}</p> : null}
          {turns.map((turn) => (
            <div key={turn.id} className="grid gap-3">
              <ChatMessage from="user" authorLabel={t(K.you)}>
                <span dir="auto">{turn.question}</span>
              </ChatMessage>
              <ChatMessage
                from="assistant"
                authorLabel={t(K.name)}
                avatar={<TamoMark size="md" />}
                isLoading={turn.answer === undefined && !turn.isFailed}
              >
                {turn.isFailed ? (
                  <TamoStatusLine status="error" onRetry={() => ask(turn.question)} />
                ) : turn.answer === undefined ? null : (
                  <div className="grid gap-2">
                    <p dir="auto" className="m-0 whitespace-pre-wrap">
                      {turn.answer}
                    </p>
                    <TamoMarker />
                  </div>
                )}
              </ChatMessage>
            </div>
          ))}
        </div>
      </Drawer.Body>
      <Drawer.Footer>
        <div className="grid w-full gap-1">
          <PromptInput
            label={name}
            placeholder={t(K.panel_placeholder)}
            status={isWorking ? "streaming" : "ready"}
            onSubmit={ask}
            onStop={stop}
          />
          <p className="m-0 text-xs text-muted">{t(K.disclaimer)}</p>
        </div>
      </Drawer.Footer>
    </Drawer>
  );
}
