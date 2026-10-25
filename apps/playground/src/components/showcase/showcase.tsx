/**
 * Stackra file contract:
 * Purpose: the index page's live showcase: three small product scenes composed from the real @stackra/ui
 *          components (an invite form, a deployments list, a filter panel) on glass cards, so the system is seen at
 *          work before it is browsed part by part. Every control works; nothing is sent anywhere.
 * Boundary: presentation and local state only; the scenes are samples, not features. Each scene's title is a
 *          heading at the level the caller gives.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0294 (decision 14).
 */
import type { HeadingLevel, Tone } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useState } from "react";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::showcase.*` keys.
const STRINGS = {
  invite: {
    title: "Invite your team",
    description: "They get an email with a link that works for seven days.",
    email: "Work email",
    placeholder: "name@company.com",
    admin: "Make them an admin",
    send: "Send invite",
    sent: (email: string) => `Invite sent to ${email || "your teammate"}.`,
  },
  deploys: {
    title: "Deployments",
    description: "The last three releases of the console.",
  },
  filters: {
    title: "Filter orders",
    description: "Narrow the list; the count follows.",
    search: "Search orders",
    paid: "Paid only",
    shipped: "Shipped",
    reset: "Reset",
    count: (count: number) => `${count} orders`,
  },
} as const;

/** The sample deployments: who shipped, what, and how it went. */
const DEPLOYS: readonly { name: string; version: string; status: string; tone: Tone }[] = [
  { name: "Lina Haddad", version: "v2.14.0", status: "Live", tone: "success" },
  { name: "Omar Saleh", version: "v2.14.1", status: "Building", tone: "warning" },
  { name: "Sara Kim", version: "v2.13.9", status: "Failed", tone: "danger" },
];

/** Props of {@link Showcase}. */
export interface ShowcaseProps {
  /** The heading level of each scene's title. */
  headingLevel: HeadingLevel;
}

const CARD = "material rounded-3xl";

/** Three composed scenes. */
export function Showcase({ headingLevel }: ShowcaseProps) {
  const [email, setEmail] = useState("");
  const [isSent, setSent] = useState(false);
  const [query, setQuery] = useState("");
  const [isPaidOnly, setPaidOnly] = useState(true);
  const [isShipped, setShipped] = useState(false);
  const count = Math.max(0, 128 - query.length * 17 - (isPaidOnly ? 31 : 0) - (isShipped ? 22 : 0));

  return (
    // Laid out by the room it is given, not the window: the index gives it the page, the Theme Studio a column.
    <div className="@container">
      <div className="grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
        <Ui.Card className={CARD}>
          <Ui.Card.Header>
            <Ui.Card.Title level={headingLevel}>{STRINGS.invite.title}</Ui.Card.Title>
            <Ui.Card.Description>
              <bdi>{STRINGS.invite.description}</bdi>
            </Ui.Card.Description>
          </Ui.Card.Header>
          <Ui.Card.Content className="grid gap-4">
            <Ui.TextField
              label={STRINGS.invite.email}
              type="email"
              placeholder={STRINGS.invite.placeholder}
              value={email}
              onChange={(value) => {
                setEmail(value);
                setSent(false);
              }}
            />
            <Ui.Switch label={STRINGS.invite.admin} />
          </Ui.Card.Content>
          <Ui.Card.Footer className="flex flex-wrap items-center gap-3">
            <Ui.Button startIcon="send-horizontal" onPress={() => setSent(true)}>
              {STRINGS.invite.send}
            </Ui.Button>
            <p role="status" className="text-sm text-muted">
              {isSent ? <bdi>{STRINGS.invite.sent(email)}</bdi> : null}
            </p>
          </Ui.Card.Footer>
        </Ui.Card>

        <Ui.Card className={CARD}>
          <Ui.Card.Header>
            <Ui.Card.Title level={headingLevel}>{STRINGS.deploys.title}</Ui.Card.Title>
            <Ui.Card.Description>
              <bdi>{STRINGS.deploys.description}</bdi>
            </Ui.Card.Description>
          </Ui.Card.Header>
          <Ui.Card.Content>
            <ul className="grid divide-y divide-separator">
              {DEPLOYS.map(({ name, version, status, tone }) => (
                <li key={version} className="flex items-center gap-3 py-3">
                  <Ui.Avatar name={name} size="sm" />
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate font-medium">{name}</span>
                    <span className="font-mono text-xs text-muted">{version}</span>
                  </span>
                  {tone === "warning" ? <Ui.Spinner size="sm" tone="muted" /> : null}
                  <Ui.StatusBadge tone={tone}>{status}</Ui.StatusBadge>
                </li>
              ))}
            </ul>
          </Ui.Card.Content>
        </Ui.Card>

        <Ui.Card className={`${CARD} @2xl:col-span-2 @5xl:col-span-1`}>
          <Ui.Card.Header>
            <Ui.Card.Title level={headingLevel}>{STRINGS.filters.title}</Ui.Card.Title>
            <Ui.Card.Description>
              <bdi>{STRINGS.filters.description}</bdi>
            </Ui.Card.Description>
          </Ui.Card.Header>
          <Ui.Card.Content className="grid gap-4">
            <Ui.SearchField label={STRINGS.filters.search} value={query} onChange={setQuery} />
            <div className="grid gap-2">
              <Ui.Checkbox label={STRINGS.filters.paid} value={isPaidOnly} onChange={setPaidOnly} />
              <Ui.Checkbox
                label={STRINGS.filters.shipped}
                value={isShipped}
                onChange={setShipped}
              />
            </div>
          </Ui.Card.Content>
          <Ui.Card.Footer className="flex items-center justify-between gap-3">
            <Ui.Chip variant="soft" size="sm">
              <span role="status">{STRINGS.filters.count(count)}</span>
            </Ui.Chip>
            <Ui.Button
              variant="ghost"
              size="sm"
              startIcon="undo-2"
              onPress={() => {
                setQuery("");
                setPaidOnly(false);
                setShipped(false);
              }}
            >
              {STRINGS.filters.reset}
            </Ui.Button>
          </Ui.Card.Footer>
        </Ui.Card>
      </div>
    </div>
  );
}
