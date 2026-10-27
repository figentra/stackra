/**
 * Stackra file contract:
 * Purpose: the design-system landing's live showcase, the native twin of the web playground's `showcase`: three small
 *          product scenes composed from the real @stackra/ui components (an invite form, a deployments list, a filter
 *          panel) on solid cards, so the system is seen at work before it is browsed part by part. Every control
 *          works; nothing is sent anywhere.
 * Boundary: presentation and local state only; the scenes are samples, not features. The strings are the web's.
 * Runtime: react-native
 * Governing contract: ADR 0320 (glass and the showcase stage); ADR 0302 (decision 5).
 */
import type { Tone } from "@stackra/contracts";
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Chip,
  SearchField,
  Separator,
  Spinner,
  StatusBadge,
  Switch,
  Text,
  TextField,
} from "@stackra/ui/native";
import { Fragment, useState } from "react";
import { View } from "react-native";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
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

/** The three composed scenes, stacked. */
export function Showcase() {
  const [email, setEmail] = useState("");
  const [isSent, setSent] = useState(false);
  const [query, setQuery] = useState("");
  const [isPaidOnly, setPaidOnly] = useState(true);
  const [isShipped, setShipped] = useState(false);
  const count = Math.max(0, 128 - query.length * 17 - (isPaidOnly ? 31 : 0) - (isShipped ? 22 : 0));

  return (
    <View className="gap-4">
      {/* A solid card: content never sits on glass (STA-457). */}
      <Card>
        <Card.Header>
          <Card.Title>{STRINGS.invite.title}</Card.Title>
          <Card.Description>{STRINGS.invite.description}</Card.Description>
        </Card.Header>
        <Card.Content className="gap-4">
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
        <Card.Footer className="flex-row flex-wrap items-center gap-3">
          <Button startIcon="send-horizontal" onPress={() => setSent(true)}>
            {STRINGS.invite.send}
          </Button>
          <Text type="small" tone="muted" accessibilityLiveRegion="polite" className="flex-1">
            {isSent ? STRINGS.invite.sent(email) : ""}
          </Text>
        </Card.Footer>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>{STRINGS.deploys.title}</Card.Title>
          <Card.Description>{STRINGS.deploys.description}</Card.Description>
        </Card.Header>
        <Card.Content>
          {DEPLOYS.map(({ name, version, status, tone }, index) => (
            <Fragment key={version}>
              {index > 0 ? <Separator /> : null}
              <View className="flex-row items-center gap-3 py-3">
                <Avatar name={name} size="sm" />
                <View className="min-w-0 flex-1">
                  <Text numberOfLines={1} className="font-medium">
                    {name}
                  </Text>
                  <Text type="caption" tone="muted" className="font-mono">
                    {version}
                  </Text>
                </View>
                {tone === "warning" ? <Spinner size="sm" tone="muted" /> : null}
                <StatusBadge tone={tone}>{status}</StatusBadge>
              </View>
            </Fragment>
          ))}
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>{STRINGS.filters.title}</Card.Title>
          <Card.Description>{STRINGS.filters.description}</Card.Description>
        </Card.Header>
        <Card.Content className="gap-4">
          <SearchField label={STRINGS.filters.search} value={query} onChange={setQuery} />
          <View className="gap-2">
            <Checkbox label={STRINGS.filters.paid} value={isPaidOnly} onChange={setPaidOnly} />
            <Checkbox label={STRINGS.filters.shipped} value={isShipped} onChange={setShipped} />
          </View>
        </Card.Content>
        <Card.Footer className="flex-row items-center justify-between gap-3">
          <View accessibilityLiveRegion="polite">
            <Chip variant="soft" size="sm">
              {STRINGS.filters.count(count)}
            </Chip>
          </View>
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
    </View>
  );
}
