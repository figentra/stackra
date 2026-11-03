/**
 * Stackra file contract:
 * Purpose: the web `PackageList`: a named list of packages, each its npm name in mono (a link when it has one) and a
 *          one-line description, cut at `maxVisible` rows with the last ones fading out.
 * Boundary: a `ul` named by `label`. The fade is a mask on the list, so the faded rows are still read. Package names
 *           are Latin and isolated in their own direction (`dir="ltr"`), so they never reorder in Arabic.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); STA-2041.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { Link } from "#react/link/link";
import type { PackageListProps } from "#react/package-list/package-list.props";

/** A list of packages that fades out after `maxVisible` rows. */
export function PackageList({
  items,
  maxVisible = 5,
  hasFade = true,
  label,
  className,
}: PackageListProps): ReactElement {
  const shown = items.slice(0, Math.max(1, maxVisible));
  return (
    <ul
      aria-label={label}
      data-slot="package-list"
      className={cn(
        "flex flex-col divide-y divide-border",
        hasFade &&
          items.length > shown.length &&
          "[mask-image:linear-gradient(to_bottom,black_55%,transparent)]",
        className,
      )}
    >
      {shown.map((item) => (
        <li key={item.name} className="flex flex-col gap-0.5 py-2">
          <bdi dir="ltr" className="font-mono text-sm text-foreground">
            {item.href ? <Link href={item.href}>{item.name}</Link> : item.name}
          </bdi>
          <span className="text-sm text-muted">{item.description}</span>
        </li>
      ))}
    </ul>
  );
}
