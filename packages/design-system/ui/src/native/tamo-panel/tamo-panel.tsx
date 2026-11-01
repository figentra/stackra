/**
 * Stackra file contract:
 * Purpose: the native `TamoPanel`: the Ask Tamo panel (the house Drawer) drawn from the slot's `panel` state: the
 *          screen it is on, the questions and answers (each answer marked as Tamo's), the composer and a disclaimer.
 *          Opened with a question (the launcher, the command palette), it asks it at once.
 * Boundary: rendered once by the AI module's provider, so any part can open it with no launcher mounted. Answers are
 *           text Tamo drafts; nothing on the screen changes from here.
 * Runtime: react-native
 * Governing contract: ADR 0507 (the Ask Tamo launcher and side panel); ADR 0490 (page context); WCAG 2.2 SC 4.1.3.
 */
import { useEffect, useRef, useState, type ReactElement } from "react";
import { View } from "react-native";

import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { useTamo } from "#react/hooks/use-tamo";
import { useUiText } from "#react/hooks/use-ui-text";
import { ChatMessage } from "#native/chat-message/chat-message";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { Drawer } from "#native/drawer/drawer";
import { PromptInput } from "#native/prompt-input/prompt-input";
import { TamoMark } from "#native/tamo-mark/tamo-mark";
import { TamoMarker } from "#native/tamo-marker/tamo-marker";
import { TamoStatusLine } from "#native/tamo-status-line/tamo-status-line";
import { Text } from "#native/text/text";
import type { TamoPanelProps } from "#native/tamo-panel/tamo-panel.props";

/** K: the Tamo words. */
const K = TAMO_KEYS.ui.tamo;

/** One turn of the panel. */
interface Turn {
  readonly id: number;
  readonly question: string;
  readonly answer?: string | undefined;
  readonly failed?: boolean | undefined;
}

/** The Ask Tamo panel. Draws nothing without the AI module or with Tamo off for the screen. */
export function TamoPanel({ className }: TamoPanelProps): ReactElement | null {
  const t = useUiText();
  const { locale } = useDesignSystem();
  const tamo = useTamo();
  const [turns, setTurns] = useState<readonly Turn[]>([]);
  const controller = useRef<AbortController | null>(null);
  const asked = useRef<string | undefined>(undefined);
  const isWorking = turns.some((turn) => turn.answer === undefined && !turn.failed);

  const ask = (question: string) => {
    if (!tamo) return;
    controller.current?.abort();
    const own = new AbortController();
    controller.current = own;
    const id = Date.now();
    setTurns((all) => [...all, { id, question }]);
    tamo.run("ask", { question, locale }, own.signal).then(
      (answer) =>
        setTurns((all) => all.map((turn) => (turn.id === id ? { ...turn, answer } : turn))),
      () => {
        if (!own.signal.aborted)
          setTurns((all) => all.map((turn) => (turn.id === id ? { ...turn, failed: true } : turn)));
      },
    );
  };
  const stop = () => {
    controller.current?.abort();
    setTurns((all) => all.filter((turn) => turn.answer !== undefined || turn.failed));
  };

  // A question handed over by another part is asked once, as the panel opens.
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
      isOpen={tamo.panel.isOpen}
      onOpenChange={(isOpen) => (isOpen ? tamo.panel.open() : tamo.panel.close())}
      label={name}
    >
      <Drawer.Header>
        <Drawer.Title>{name}</Drawer.Title>
        {tamo.screenLabel ? (
          <Drawer.Description>
            {t(K.panel_context, { screen: tamo.screenLabel })}
          </Drawer.Description>
        ) : null}
      </Drawer.Header>
      <Drawer.Body>
        <View accessibilityLabel={name} className={["gap-4", className].filter(Boolean).join(" ")}>
          {turns.length === 0 ? (
            <Text type="small" tone="muted">
              {t(K.panel_empty)}
            </Text>
          ) : null}
          {turns.map((turn) => (
            <View key={turn.id} className="gap-3">
              <ChatMessage from="user" authorLabel={t(K.you)}>
                <Text>{turn.question}</Text>
              </ChatMessage>
              <ChatMessage
                from="assistant"
                authorLabel={t(K.name)}
                avatar={
                  <TamoMark
                    size="md"
                    status={turn.answer === undefined && !turn.failed ? "working" : "idle"}
                  />
                }
                isLoading={turn.answer === undefined && !turn.failed}
              >
                {turn.failed ? (
                  <TamoStatusLine status="error" onRetry={() => ask(turn.question)} />
                ) : turn.answer === undefined ? null : (
                  <View className="gap-2">
                    <Text>{turn.answer}</Text>
                    <TamoMarker />
                  </View>
                )}
              </ChatMessage>
            </View>
          ))}
        </View>
      </Drawer.Body>
      <Drawer.Footer>
        <View className="w-full gap-1">
          <PromptInput
            label={name}
            placeholder={t(K.panel_placeholder)}
            status={isWorking ? "streaming" : "ready"}
            onSubmit={ask}
            onStop={stop}
          />
          <Text type="caption" tone="muted">
            {t(K.disclaimer)}
          </Text>
        </View>
      </Drawer.Footer>
    </Drawer>
  );
}
