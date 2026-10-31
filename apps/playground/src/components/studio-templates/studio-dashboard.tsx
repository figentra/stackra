/**
 * Stackra file contract:
 * Purpose: the Theme Studio's "Dashboard" template: a page header with search and an action, four KPI cards, a
 *          revenue chart, a goal and a table of recent orders, all real @stackra/ui components (the
 *          chart is plain bars in the theme's accent).
 * Boundary: a canvas template with no props; the theme is the canvas's. Fixed sample data.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio).
 */
import type { Tone } from "@stackra/contracts";
import type { IconName } from "@stackra/icons/contracts";
import type { TableColumn } from "@stackra/ui/contracts";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Heading,
  Icon,
  ProgressBar,
  SearchField,
  Stat,
  Table,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { THEME_STUDIO_KEYS } from "#src/routes/theme-studio/theme-studio-keys.constant";

import { STUDIO_DISPLAY } from "./studio-display.constant";

/** The template's keys. */
const K = THEME_STUDIO_KEYS.theme_studio.dashboard;

const METRICS = [
  {
    id: "revenue",
    icon: Icons.Wallet,
    tone: "success",
    value: 128_450,
    change: "+8.2%",
    trend: "up",
  },
  { id: "orders", icon: Icons.Receipt, tone: "success", value: 1842, change: "+3.1%", trend: "up" },
  { id: "customers", icon: Icons.Users, tone: "success", value: 964, change: "+1.4%", trend: "up" },
  {
    id: "conversion",
    icon: Icons.ChartColumn,
    tone: "danger",
    value: 3.2,
    change: "-0.4%",
    trend: "down",
  },
] as const satisfies readonly {
  id: string;
  icon: IconName;
  tone: Tone;
  value: number;
  change: string;
  trend: "up" | "down";
}[];

const REVENUE = [
  { month: "jan", revenue: 42 },
  { month: "feb", revenue: 58 },
  { month: "mar", revenue: 49 },
  { month: "apr", revenue: 72 },
  { month: "may", revenue: 66 },
  { month: "jun", revenue: 91 },
] as const;

/** The tallest month, the chart's full height. */
const PEAK = Math.max(...REVENUE.map((row) => row.revenue));

const ORDERS = [
  { id: "a", order: "#1042", person: "layla", status: "paid", total: "1,240.00" },
  { id: "b", order: "#1041", person: "omar", status: "pending", total: "380.50" },
  { id: "c", order: "#1040", person: "sara", status: "refunded", total: "96.00" },
] as const;

const STATUS_TONE: Readonly<Record<(typeof ORDERS)[number]["status"], Tone>> = {
  paid: "success",
  pending: "warning",
  refunded: "default",
};

/** The dashboard template. */
export function StudioDashboard() {
  const t = useCatalogueText(MESSAGES.en);
  const columns: readonly TableColumn[] = [
    { id: "order", label: t(K.column_order), isRowHeader: true },
    { id: "customer", label: t(K.column_customer) },
    { id: "status", label: t(K.column_status) },
    { id: "total", label: t(K.column_total), align: "end" },
  ];
  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <Heading level={2} className={`[font:var(--h2)] ${STUDIO_DISPLAY}`}>
            {t(K.title)}
          </Heading>
          <Text tone="muted">
            <bdi>{t(K.subtitle)}</bdi>
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchField aria-label={t(K.search)} placeholder={t(K.search)} className="w-56" />
          <Button startIcon={Icons.Plus}>{t(K.new)}</Button>
        </div>
      </header>
      <div className="grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-4">
        {METRICS.map((metric) => (
          <Card key={metric.id}>
            <Card.Content className="grid gap-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="grid size-9 place-items-center bg-default"
                  style={{ borderRadius: "var(--radius-lg)" }}
                >
                  <Icon name={metric.icon} size="sm" />
                </span>
                <Chip size="sm" variant="soft" tone={metric.tone}>
                  <bdi dir="ltr">{metric.change}</bdi>
                  <span className="sr-only">{t(K[metric.trend])}</span>
                </Chip>
              </div>
              <Stat
                label={t(K[metric.id])}
                value={metric.id === "conversion" ? `${metric.value}%` : metric.value}
              />
              <Text type="small" tone="muted">
                <bdi>{t(K.versus)}</bdi>
              </Text>
            </Card.Content>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 @4xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <Card.Header>
            <Card.Title className={STUDIO_DISPLAY}>{t(K.chart)}</Card.Title>
          </Card.Header>
          <Card.Content>
            <div
              role="img"
              aria-label={t(K.chart)}
              className="grid h-50 grid-cols-6 items-end gap-3"
            >
              {REVENUE.map((row) => (
                <div key={row.month} className="grid h-full grid-rows-[1fr_auto] gap-2">
                  <div className="flex items-end">
                    <div
                      className="w-full bg-accent"
                      style={{
                        height: `${(row.revenue / PEAK) * 100}%`,
                        borderRadius: "var(--radius-sm)",
                      }}
                    />
                  </div>
                  <span className="text-center text-xs text-muted">{t(K.months[row.month])}</span>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Header>
            <Card.Title className={STUDIO_DISPLAY}>{t(K.goal)}</Card.Title>
            <Card.Description>
              <bdi>{t(K.goal_note)}</bdi>
            </Card.Description>
          </Card.Header>
          <Card.Content className="grid gap-5">
            <ProgressBar label={t(K.goal)} value={72} isValueVisible />
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {(["layla", "omar", "sara"] as const).map((person) => (
                <Avatar key={person} name={t(K.people[person])} size="sm" />
              ))}
            </div>
          </Card.Content>
        </Card>
      </div>
      <Card>
        <Card.Header className="flex-row items-center justify-between">
          <Card.Title className={STUDIO_DISPLAY}>{t(K.recent)}</Card.Title>
          <Button
            size="sm"
            variant="ghost"
            endIcon={<Icon name={Icons.ArrowRight} isMirroredInRtl />}
          >
            {t(K.view_all)}
          </Button>
        </Card.Header>
        <Card.Content>
          <Table
            label={t(K.recent)}
            variant="secondary"
            items={ORDERS}
            columns={columns}
            renderCell={(order, column) => {
              if (column.id === "customer") return t(K.people[order.person]);
              if (column.id === "status")
                return (
                  <Chip size="sm" variant="soft" tone={STATUS_TONE[order.status]}>
                    {t(K[order.status])}
                  </Chip>
                );
              if (column.id === "total") return <bdi dir="ltr">{order.total}</bdi>;
              return order.order;
            }}
          />
        </Card.Content>
      </Card>
    </div>
  );
}
