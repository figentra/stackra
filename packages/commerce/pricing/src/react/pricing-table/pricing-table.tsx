/**
 * Stackra file contract:
 * Purpose: `PricingTable`, the commerce kit's plan comparison block: a period switch over a responsive row of plan
 *          cards, each with its price for the period, its features and a call to action.
 * Boundary: composition of @stackra/ui only (Card, SegmentedControl, MoneyValue, Grid, Stack); no price maths: the host
 *           passes each plan's price per period, as the pricing engine evaluated it. Every word comes in props.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (light, dark, RTL).
 */
import {
  Button,
  Card,
  Chip,
  Grid,
  Icon,
  MoneyValue,
  SegmentedControl,
  Stack,
  Text,
} from "@stackra/ui/react";
import { type ReactElement, useId, useState } from "react";

import type { PricingTableProps } from "#react/pricing-table/pricing-table.props";

/** The narrowest a plan card gets before the row wraps. */
const PLAN_MIN_WIDTH = 240;

/**
 * Plan cards with a monthly/yearly (or any) switch; the featured plan is raised and its button is primary.
 *
 * @example
 * <PricingTable plans={plans} periods={periods} periodLabel={t(K.period)} onSelect={startCheckout} />
 */
export function PricingTable({
  plans,
  periods,
  period,
  defaultPeriod,
  onPeriodChange,
  periodLabel,
  onSelect,
  className,
}: PricingTableProps): ReactElement {
  const id = useId();
  const [own, setOwn] = useState(defaultPeriod ?? periods[0]?.id ?? "");
  const current = period ?? own;
  const suffix = periods.find((item) => item.id === current)?.suffix;
  const change = (next: string) => {
    setOwn(next);
    onPeriodChange?.(next);
  };
  return (
    <Stack gap="lg" align="center" className={className}>
      {periods.length > 1 && (
        <SegmentedControl
          label={periodLabel}
          items={periods.map(({ id: key, label }) => ({ id: key, label }))}
          selectedKey={current}
          onSelectionChange={change}
        />
      )}
      <Grid gap="md" minItemWidth={PLAN_MIN_WIDTH} className="w-full items-stretch">
        {plans.map((plan) => {
          const price = plan.prices[current];
          const titleId = `${id}-${plan.id}`;
          return (
            <Card
              key={plan.id}
              role="article"
              aria-labelledby={titleId}
              variant={plan.isFeatured ? "secondary" : "default"}
              data-featured={plan.isFeatured ? "" : undefined}
              className={plan.isFeatured ? "ring-2 ring-accent" : ""}
            >
              <Card.Header>
                <div className="flex items-center justify-between gap-2">
                  <Card.Title id={titleId}>{plan.name}</Card.Title>
                  {plan.badge && (
                    <Chip size="sm" tone="accent">
                      {plan.badge}
                    </Chip>
                  )}
                </div>
                {plan.description && <Card.Description>{plan.description}</Card.Description>}
              </Card.Header>
              <Card.Content className="flex flex-col gap-4">
                {price && (
                  <p className="flex items-baseline gap-1">
                    <MoneyValue
                      amount={price.amount}
                      currency={price.currency}
                      className="text-3xl font-semibold"
                    />
                    {suffix && (
                      <Text tone="muted" type="small">
                        {suffix}
                      </Text>
                    )}
                  </p>
                )}
                <ul className="flex flex-col gap-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Icon name="check" size="sm" tone="success" />
                      <Text type="small">{feature}</Text>
                    </li>
                  ))}
                </ul>
              </Card.Content>
              <Card.Footer className="mt-auto">
                <Button
                  isFullWidth
                  variant={plan.isFeatured ? "primary" : "secondary"}
                  onPress={() => onSelect(plan.id, current)}
                >
                  {plan.cta}
                </Button>
              </Card.Footer>
            </Card>
          );
        })}
      </Grid>
    </Stack>
  );
}
