/**
 * Stackra file contract:
 * Purpose: `CapabilityMatrix`, the landing's capability matrix: a real table of subjects by capability, each cell a
 *          state (yes, no, coming) drawn as an icon with its word, or a short note.
 * Boundary: composition of @stackra/ui only; every word comes in props. A state is never colour or an icon alone: its
 *           word is always visible. On a narrow screen the table scrolls inside a focusable, named region, so the
 *           keyboard can reach every column. A column a row leaves out is an empty cell.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 16); ADR 0504 (module UI kits); WCAG 2.2 1.3.1, 1.4.1 and 2.1.1; STA-2041.
 */
import type { IconName } from "@stackra/icons/contracts";
import type { TypographyTone } from "@stackra/ui/contracts";
import { Icon, Text } from "@stackra/ui/react";
import type { ReactElement, ReactNode } from "react";

import { CAPABILITY_STATE_ICONS } from "#core/constants/capability-state-icons.constant";
import type { CapabilityMatrixProps } from "#react/capability-matrix/capability-matrix.props";

/** The icon and tone of each state code. */
const STATE_LOOK: Readonly<
  Record<string, { readonly icon: IconName; readonly tone: TypographyTone }>
> = {
  yes: { icon: CAPABILITY_STATE_ICONS.yes, tone: "success" },
  no: { icon: CAPABILITY_STATE_ICONS.no, tone: "muted" },
  coming: { icon: CAPABILITY_STATE_ICONS.coming, tone: "accent" },
};

/**
 * Subjects by capability, as an accessible table.
 *
 * @example
 * <CapabilityMatrix label="Carriers" rowHeader="Carrier" columns={columns} rows={rows} stateLabels={labels} />
 */
export function CapabilityMatrix({
  label,
  rowHeader,
  columns,
  rows,
  stateLabels,
  className,
}: CapabilityMatrixProps): ReactElement {
  /** A cell's content: a state's icon and word, a note, or nothing. */
  const cell = (value: string | undefined): ReactNode => {
    if (value === undefined) return null;
    const look = STATE_LOOK[value];
    if (look === undefined) return <Text type="small">{value}</Text>;
    return (
      <Text
        elementType="span"
        type="small"
        tone={look.tone}
        className="inline-flex items-center gap-1.5"
      >
        <Icon name={look.icon} aria-hidden />
        {stateLabels[value as keyof typeof stateLabels]}
      </Text>
    );
  };
  return (
    <section
      aria-label={label}
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- reason: a scroll region must take focus so a keyboard user can scroll it (WCAG 2.1.1)
      tabIndex={0}
      className={`overflow-x-auto rounded-lg border border-border ${className ?? ""}`}
    >
      <table className="w-full border-collapse text-start">
        <caption className="px-4 py-3 text-start">
          <Text className="font-semibold">{label}</Text>
        </caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="px-4 py-2 text-start">
              <Text type="small" tone="muted">
                {rowHeader}
              </Text>
            </th>
            {columns.map((column) => (
              <th key={column.id} scope="col" className="px-4 py-2 text-start">
                <Text type="small" tone="muted">
                  {column.label}
                </Text>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-border last:border-b-0">
              <th scope="row" className="px-4 py-3 text-start align-top">
                <Text className="font-semibold">{row.name}</Text>
                {row.group === undefined ? null : (
                  <Text type="small" tone="muted">
                    {row.group}
                  </Text>
                )}
              </th>
              {columns.map((column) => (
                <td key={column.id} className="px-4 py-3 align-top">
                  {cell(row.cells[column.id])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
