/**
 * Stackra file contract:
 * Purpose: `FeatureSection`, the marketing kit's feature section block: an eyebrow, title and intro over a responsive
 *          grid of features, each with an icon, a title and a line.
 * Boundary: composition of @stackra/ui only; every word and icon comes in props.
 * Runtime: browser
 * Governing contract: ADR 0503 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (light, dark, RTL).
 */
import { Heading, Icon, Text } from "@stackra/ui/react";
import { isValidElement, type ReactElement, useId } from "react";

import type { FeatureSectionProps } from "#react/feature-section/feature-section.props";

/** The wide-screen column class of each count (Tailwind needs the whole class name). */
const COLUMNS = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
} as const;

/**
 * A titled section of features.
 *
 * @example
 * <FeatureSection eyebrow="Why us" title="Everything a shop needs" features={features} />
 */
export function FeatureSection({
  eyebrow,
  title,
  description,
  features,
  columns = 3,
  className,
}: FeatureSectionProps): ReactElement {
  const id = useId();
  return (
    <section aria-labelledby={id} className={`flex flex-col gap-8 ${className ?? ""}`}>
      <header className="flex max-w-2xl flex-col gap-2">
        {eyebrow && (
          <Text tone="accent" type="small" className="font-semibold">
            {eyebrow}
          </Text>
        )}
        <Heading level={2} type="h2" id={id}>
          {title}
        </Heading>
        {description && <Text tone="muted">{description}</Text>}
      </header>
      <ul className={`grid gap-6 ${COLUMNS[columns]}`}>
        {features.map((feature) => (
          <li key={feature.id} className="flex flex-col gap-2">
            {feature.icon !== undefined && (
              <span className="flex size-10 items-center justify-center rounded-field bg-accent-soft text-accent">
                {isValidElement(feature.icon) ? feature.icon : <Icon name={feature.icon} />}
              </span>
            )}
            <Heading level={3} type="h6">
              {feature.title}
            </Heading>
            <Text tone="muted" type="small">
              {feature.description}
            </Text>
          </li>
        ))}
      </ul>
    </section>
  );
}
