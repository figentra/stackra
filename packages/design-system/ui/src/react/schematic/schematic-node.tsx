/**
 * Stackra file contract:
 * Purpose: the web `SchematicNode`: one named part of a `Schematic`, the box its pipes leave from and arrive at.
 * Boundary: a plain block in the machine's reading order; positioned, so it paints above the pipes. Its name is a data
 *           attribute the machine measures by, never a DOM id.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0501 (section 9, the blueprint roles); STA-2041.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import type { SchematicNodeProps } from "#react/schematic/schematic-node.props";

/** One part of a schematic machine. */
export function SchematicNode({ id, children, className }: SchematicNodeProps): ReactElement {
  return (
    <div data-slot="schematic-node" data-schematic-node={id} className={cn("relative", className)}>
      {children}
    </div>
  );
}
