/**
 * Stackra file contract:
 * Purpose: the "discussion" demo of the web CommentThread: mentions and resolve.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { CommentThread, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { COMMENT_THREAD_KEYS } from "#src/demos/free/comment-thread/comment-thread-keys.constant";

/** The demo's keys. */
const K = COMMENT_THREAD_KEYS.comment_thread;

/** Comment thread: two comments, a reply box with @mentions, and resolve. */
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
      className="w-full max-w-lg"
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
