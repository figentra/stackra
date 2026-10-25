/**
 * Stackra file contract:
 * Purpose: the page of the ChatListView route: `@stackra-pro/ui`'s ChatListView as a list of conversations with an icon,
 *          a title, a one-line preview and the time of the last message, in the default density and in the compact
 *          density, each list named for screen readers and selectable by keyboard.
 * Boundary: presentation only; the threads are local. Titles and previews are isolated (`<bdi>`) so a right-to-left page
 *          keeps mixed text readable.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra-pro/ui/react";

import { DemoIcon } from "#src/components/demo-icon";
import { ProChatListViewRoute } from "#src/routes/pro-chat-list-view/pro-chat-list-view.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-chat-list-view.*` keys.
const STRINGS = {
  documentTitle: `${ProChatListViewRoute.title} · Stackra Playground`,
  intro:
    "Rows for recent conversations: a title, a preview and when it was last active. Move through the rows with the arrow keys.",
  roomy: "Default",
  roomyLabel: "Recent chats",
  compact: "Compact",
  compactLabel: "Recent chats, compact",
} as const;

/** One conversation. */
interface Thread {
  readonly id: string;
  readonly title: string;
  readonly preview: string;
  readonly updatedAt: string;
}

const THREADS: readonly Thread[] = [
  {
    id: "1",
    title: "Product launch planning",
    preview: "Can you help me draft a launch checklist?",
    updatedAt: "2h ago",
  },
  {
    id: "2",
    title: "Customer feedback review",
    preview: "Summarize the customer feedback from last week.",
    updatedAt: "Yesterday",
  },
  {
    id: "3",
    title: "Copy editing help",
    preview: "Rewrite this paragraph to sound more concise.",
    updatedAt: "Mon",
  },
];

/** The ChatListView page. */
export function ProChatListView() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProChatListViewRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,30rem)_minmax(0,20rem)]">
        <section aria-labelledby="roomy-heading" className="grid gap-3">
          <h2 id="roomy-heading" className="type-h2">
            {STRINGS.roomy}
          </h2>
          <UiPro.ChatListView label={STRINGS.roomyLabel} items={THREADS}>
            {(thread: Thread) => (
              <UiPro.ChatListView.Item id={thread.id} textValue={thread.title}>
                <UiPro.ChatListView.ItemContent>
                  <UiPro.ChatListView.Icon>
                    <DemoIcon name="doc" />
                  </UiPro.ChatListView.Icon>
                  <UiPro.ChatListView.Text>
                    <UiPro.ChatListView.Title>
                      <bdi>{thread.title}</bdi>
                    </UiPro.ChatListView.Title>
                    <UiPro.ChatListView.Preview>
                      <bdi>{thread.preview}</bdi>
                    </UiPro.ChatListView.Preview>
                  </UiPro.ChatListView.Text>
                  <UiPro.ChatListView.Meta>
                    <bdi>{thread.updatedAt}</bdi>
                  </UiPro.ChatListView.Meta>
                </UiPro.ChatListView.ItemContent>
              </UiPro.ChatListView.Item>
            )}
          </UiPro.ChatListView>
        </section>
        <section aria-labelledby="compact-heading" className="grid gap-3">
          <h2 id="compact-heading" className="type-h2">
            {STRINGS.compact}
          </h2>
          <UiPro.ChatListView label={STRINGS.compactLabel} density="compact" items={THREADS}>
            {(thread: Thread) => (
              <UiPro.ChatListView.Item id={thread.id} textValue={thread.title}>
                <UiPro.ChatListView.ItemContent>
                  <UiPro.ChatListView.Icon>
                    <DemoIcon name="doc" />
                  </UiPro.ChatListView.Icon>
                  <UiPro.ChatListView.Text>
                    <UiPro.ChatListView.Title>
                      <bdi>{thread.title}</bdi>
                    </UiPro.ChatListView.Title>
                  </UiPro.ChatListView.Text>
                  <UiPro.ChatListView.Meta>
                    <bdi>{thread.updatedAt}</bdi>
                  </UiPro.ChatListView.Meta>
                </UiPro.ChatListView.ItemContent>
              </UiPro.ChatListView.Item>
            )}
          </UiPro.ChatListView>
        </section>
      </div>
    </article>
  );
}
