/**
 * Stackra file contract:
 * Purpose: `SIZE_BY_ENVIRONMENT_SCHEMA`, a resource's or a workload's size per environment (`small`, `medium`, `large`);
 *          an environment it does not name runs `small`.
 * Boundary: internal; the resource and workload schemas compose it.
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (decision 3).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { ResourceSize } from "#core/enums/resource-size.enum";
import { RunwayEnvironment } from "#core/enums/runway-environment.enum";

/** A size per environment. */
export const SIZE_BY_ENVIRONMENT_SCHEMA = z.partialRecord(
  z.enum(Enum.values(RunwayEnvironment) as [RunwayEnvironment, ...RunwayEnvironment[]]),
  z.enum(Enum.values(ResourceSize) as [ResourceSize, ...ResourceSize[]]),
);
