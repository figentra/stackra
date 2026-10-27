/**
 * Stackra file contract:
 * Purpose: a titled section of a playground page: a named region (`section` labelled by its level-2 heading, drawn
 *          with @stackra/ui's Heading) with an optional one-line note under the heading. Every component page is a
 *          stack of these, so the e2e suites and the unit tests find each group by its region name.
 * Boundary: layout and the heading only; the section's content is the caller's.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0294 (decision 14); WCAG 2.2 SC 1.3.1.
 */
import { Heading, Text } from "@stackra/ui/react";
import type { PageSectionProps } from "./page-section.props";

/** A named region with a level-2 heading and an optional note. */
export function PageSection({ id, title, note, children }: PageSectionProps) {
  return (
    <section aria-labelledby={id} className="grid gap-4">
      <Heading id={id} level={2}>
        {title}
      </Heading>
      {/* <bdi>: an English sentence keeps its full stop at its end inside a right-to-left page. */}
      {note ? (
        <Text tone="muted" className="max-w-prose">
          <bdi>{note}</bdi>
        </Text>
      ) : null}
      {children}
    </section>
  );
}
