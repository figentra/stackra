/**
 * Stackra file contract:
 * Purpose: `maintainAllPartitions(now)`, the partition upkeep of every registered `Partitioned` model: runs
 *          `maintainPartitions` for each in turn and answers one report per table.
 * Boundary: reads the registered entity schemas, which gen's entity files fill; runs on the connected `Database` as
 *           `maintainPartitions` does. The partition job of @stackra/data-maintenance calls it and audits the reports;
 *           this package declares no job.
 * Runtime: node
 * Governing contract: data-layer gaps db12, cdc6, sc4; ADR 0134 (holds); ADR 0462 (decision 1: jobs live in an
 *                     add-on above iam).
 */
import { traitsOf } from "@stackra/model";

import { REGISTERED_ENTITIES } from "#core/constants/registered-entities.constant";
import { maintainPartitions } from "#core/functions/maintain-partitions.function";
import type { PartitionReport } from "#core/types/partition-report.type";

/**
 * Keeps every partitioned table current.
 *
 * @example
 * const reports = await maintainAllPartitions(new Date());
 */
export async function maintainAllPartitions(now: Date): Promise<readonly PartitionReport[]> {
  const reports: PartitionReport[] = [];
  for (const schema of REGISTERED_ENTITIES) {
    const model = schema.meta.class;
    if (traitsOf(model).some((trait) => trait.name === "partitioned"))
      reports.push(await maintainPartitions(model, now));
  }
  return reports;
}
