/**
 * Stackra file contract:
 * Purpose: the "streaming" demo of the native MessageScroller: a delivery question whose answer streams in word
 *          by word; the scroller follows it at the bottom and stays put when you scroll up.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Button, MessageScroller, Text, useCatalogueText } from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MESSAGE_SCROLLER_DEMO_KEYS } from "#src/demos/free/message-scroller/message-scroller-demo-keys.constant";

/** The demo's keys. */
const K = MESSAGE_SCROLLER_DEMO_KEYS.demo_free.message_scroller.streaming;

/** How often the next word arrives, in milliseconds. */
const WORD_MS = 90;

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
    <Text key={`q${round}`} className="self-end bg-accent-soft px-3 py-2">
      {t(K.question)}
    </Text>,
    <Text key={`a${round}`} className="py-2">
      {round === rounds - 1 ? words.slice(0, shown).join(" ") : t(K.answer)}
    </Text>,
  ]).flat();

  return (
    <View className="gap-3">
      <View className="h-72 border border-border bg-surface p-3">
        <MessageScroller>
          <Text className="py-2">{t(K.earlier_1)}</Text>
          <Text className="self-end bg-accent-soft px-3 py-2">{t(K.earlier_2)}</Text>
          <Text className="py-2">{t(K.earlier_3)}</Text>
          {turns}
        </MessageScroller>
      </View>
      <Button
        variant="secondary"
        isDisabled={shown < words.length}
        onPress={() => {
          setRounds(rounds + 1);
          setShown(0);
        }}
      >
        {t(K.ask)}
      </Button>
    </View>
  );
}
