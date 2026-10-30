/**
 * Stackra file contract:
 * Purpose: the "discussion" demo of the native CommentThread: mentions and resolve.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave 3b).
 */
import { CommentThread, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { COMMENT_THREAD_DEMO_KEYS } from "#src/demos/free/comment-thread/comment-thread-demo-keys.constant";

/** The demo's keys. */
const K = COMMENT_THREAD_DEMO_KEYS.demo_free.comment_thread.discussion;

/** Two comments, a reply box with @mentions, and resolve. */
export default function Discussion() {
  const t = useCatalogueText(MESSAGES.en);
  const sara = { id: "sara", name: t(K.sara) };
  const omar = { id: "omar", name: t(K.omar) };
  const lina = { id: "lina", name: t(K.lina) };
  const [comments, setComments] = useState([
    { id: "1", author: sara, body: t(K.first), createdAt: "2026-10-27T09:12:00Z" },
    { id: "2", author: omar, body: t(K.second), createdAt: "2026-10-27T10:40:00Z" },
  ]);
  const [isResolved, setResolved] = useState(false);
  return (
    <CommentThread
      label={t(K.label)}
      comments={comments}
      people={[sara, omar, lina]}
      isResolved={isResolved}
      onResolvedChange={setResolved}
      onReply={(body) =>
        setComments((list) => [
          ...list,
          { id: String(list.length + 1), author: sara, body, createdAt: new Date().toISOString() },
        ])
      }
    />
  );
}
