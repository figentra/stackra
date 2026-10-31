/**
 * Stackra file contract:
 * Purpose: the "streaming" demo of the web MessageScroller: a delivery question whose answer streams in word by word;
 *          the scroller follows it while you are at the bottom and stays put when you scroll up to read.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Button, MessageScroller, Text, useCatalogueText } from "@stackra/ui/react";
import { useEffect, useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { MESSAGE_SCROLLER_KEYS } from "#src/demos/free/message-scroller/message-scroller-keys.constant";

/** The demo's keys. */
const K = MESSAGE_SCROLLER_KEYS.message_scroller.streaming;

/** How often the next word arrives, in milliseconds. */
// oxlint-disable-next-line stackra/no-literal-duration -- a demo's simulated word stream, not motion
const WORD_MS = 90;

/** A message bubble: the person's at the end, the assistant's at the start. */
function Bubble({ isMine, text }: { readonly isMine: boolean; readonly text: string }) {
  return (
    <Text
      className={isMine ? "ms-auto max-w-[80%] bg-accent-soft px-3 py-2" : "max-w-[85%] px-1 py-2"}
      style={{ borderRadius: "var(--radius-container)" }}
    >
      {text}
    </Text>
  );
}

/** MessageScroller: Streaming answer. */
export default function Streaming() {
  const t = useCatalogueText(MESSAGES.en);
  const words = t(K.answer).split(" ");
  const [rounds, setRounds] = useState(1);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown >= words.length) return;
    const timer = setTimeout(() => setShown(shown + 1), WORD_MS);
    return () => clearTimeout(timer);
  }, [shown, words.length]);

  const turns = Array.from({ length: rounds }, (_, round) => [
    <Bubble key={`q${round}`} isMine text={t(K.question)} />,
    <Bubble
      key={`a${round}`}
      isMine={false}
      text={round === rounds - 1 ? words.slice(0, shown).join(" ") : t(K.answer)}
    />,
  ]).flat();

  return (
    <div className="grid w-full max-w-md gap-3">
      <MessageScroller className="h-72 border border-border bg-surface p-3">
        <Bubble isMine={false} text={t(K.earlier_1)} />
        <Bubble isMine text={t(K.earlier_2)} />
        <Bubble isMine={false} text={t(K.earlier_3)} />
        {turns}
      </MessageScroller>
      <Button
        variant="secondary"
        className="justify-self-start"
        isDisabled={shown < words.length}
        onPress={() => {
          setRounds(rounds + 1);
          setShown(0);
        }}
      >
        {t(K.ask)}
      </Button>
    </div>
  );
}
