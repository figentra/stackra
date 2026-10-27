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
import type { Tone } from "@stackra/ui/contracts";
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Chip,
  SearchField,
  Spinner,
  StatusBadge,
  Switch,
  TextField,
} from "@stackra/ui/react";
import { useState } from "react";
import type { ShowcaseProps } from "./showcase.props";

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

const CARD = "material-thick rounded-3xl";

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
        <Card className={CARD}>
          <Card.Header>
            <Card.Title level={headingLevel}>{STRINGS.invite.title}</Card.Title>
            <Card.Description>
              <bdi>{STRINGS.invite.description}</bdi>
            </Card.Description>
          </Card.Header>
          <Card.Content className="grid gap-4">
            <TextField
              label={STRINGS.invite.email}
              type="email"
              placeholder={STRINGS.invite.placeholder}
              value={email}
              onChange={(value) => {
                setEmail(value);
                setSent(false);
              }}
            />
            <Switch label={STRINGS.invite.admin} />
          </Card.Content>
          <Card.Footer className="flex flex-wrap items-center gap-3">
            <Button startIcon="send-horizontal" onPress={() => setSent(true)}>
              {STRINGS.invite.send}
            </Button>
            <p role="status" className="text-sm text-muted">
              {isSent ? <bdi>{STRINGS.invite.sent(email)}</bdi> : null}
            </p>
          </Card.Footer>
        </Card>

        <Card className={CARD}>
          <Card.Header>
            <Card.Title level={headingLevel}>{STRINGS.deploys.title}</Card.Title>
            <Card.Description>
              <bdi>{STRINGS.deploys.description}</bdi>
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <ul className="grid divide-y divide-separator">
              {DEPLOYS.map(({ name, version, status, tone }) => (
                <li key={version} className="flex items-center gap-3 py-3">
                  <Avatar name={name} size="sm" />
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate font-medium">{name}</span>
                    <span className="font-mono text-xs text-muted">{version}</span>
                  </span>
                  {tone === "warning" ? <Spinner size="sm" tone="muted" /> : null}
                  <StatusBadge tone={tone}>{status}</StatusBadge>
                </li>
              ))}
            </ul>
          </Card.Content>
        </Card>

        <Card className={`${CARD} @2xl:col-span-2 @5xl:col-span-1`}>
          <Card.Header>
            <Card.Title level={headingLevel}>{STRINGS.filters.title}</Card.Title>
            <Card.Description>
              <bdi>{STRINGS.filters.description}</bdi>
            </Card.Description>
          </Card.Header>
          <Card.Content className="grid gap-4">
            <SearchField label={STRINGS.filters.search} value={query} onChange={setQuery} />
            <div className="grid gap-2">
              <Checkbox label={STRINGS.filters.paid} value={isPaidOnly} onChange={setPaidOnly} />
              <Checkbox label={STRINGS.filters.shipped} value={isShipped} onChange={setShipped} />
            </div>
          </Card.Content>
          <Card.Footer className="flex items-center justify-between gap-3">
            <Chip variant="soft" size="sm">
              <span role="status">{STRINGS.filters.count(count)}</span>
            </Chip>
            <Button
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
            </Button>
          </Card.Footer>
        </Card>
      </div>
    </div>
  );
}
