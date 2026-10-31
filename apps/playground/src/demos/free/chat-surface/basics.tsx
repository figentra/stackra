/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web ChatSurface block (@stackra/ai): a shop assistant answering where an order is, with its steps, a source and a streamed reply.
 * Boundary: a demo with no props: the kit block, @stackra/ui and local state only; every word from the catalogue and
 *           every price and option as demo data. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0503 (module UI kits).
 */
import { ChatSurface } from "@stackra/ai/react";
import { useCatalogueText } from "@stackra/ui/react";
import { useEffect, useState } from "react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { CHAT_SURFACE_KEYS } from "#src/demos/free/chat-surface/chat-surface-keys.constant";

/** The demo's keys. */
const K = CHAT_SURFACE_KEYS.chat_surface.basics;

/** One turn, as the agent runtime hands it over. */
type Turn = Parameters<typeof ChatSurface>[0]["messages"][number];

/** Chat surface: a conversation with a streamed reply. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [turns, setTurns] = useState<readonly Turn[]>(() => [
    { id: "1", role: "user", text: t(K.ask) },
    {
      id: "2",
      role: "assistant",
      text: t(K.answer),
      reasoning: [
        { key: "find", label: t(K.step_find), content: t(K.step_find) },
        { key: "track", label: t(K.step_track), content: t(K.step_track) },
      ],
      sources: [{ key: "tracking", title: t(K.source), href: "https://example.com/orders/2048" }],
    },
  ]);
  const [isStreaming, setStreaming] = useState(false);
  // A pretend stream: the reply appears after a moment, as the runtime would push it.
  useEffect(() => {
    if (!isStreaming) return undefined;
    const timer = setTimeout(() => {
      setTurns((all) =>
        all.map((turn, i) => (i === all.length - 1 ? { ...turn, text: t(K.reply) } : turn)),
      );
      setStreaming(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [isStreaming, t]);
  const send = (text: string) => {
    setTurns((all) => [
      ...all,
      { id: `${all.length + 1}`, role: "user", text },
      { id: `${all.length + 2}`, role: "assistant", text: "" },
    ]);
    setStreaming(true);
  };
  return (
    <div className="h-128 w-full">
      <ChatSurface
        messages={turns}
        onSend={send}
        isStreaming={isStreaming}
        onStop={() => setStreaming(false)}
        suggestions={[
          { id: "track", title: t(K.track), icon: Icons.Truck },
          { id: "return", title: t(K.return), icon: Icons.RotateCcw },
        ]}
        labels={{
          log: t(K.log),
          generated: t(K.generated),
          prompt: t(K.prompt),
          placeholder: t(K.placeholder),
          disclaimer: t(K.disclaimer),
          reasoning: t(K.reasoning),
          user: t(K.user),
          assistant: t(K.assistant),
        }}
      />
    </div>
  );
}
