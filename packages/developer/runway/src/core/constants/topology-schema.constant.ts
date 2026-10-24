/**
 * Stackra file contract:
 * Purpose: `TOPOLOGY_SCHEMA`, the `topology` of one root runway environment: the mode, the members that keep their own
 *          database server and network policy (`isolate`), the `default` group, and each group's members, cpu, memory,
 *          instances, optional scaling rule and optional split workers.
 * Boundary: internal; the shape only. That each member of a grouped environment sits in exactly one group, and that
 *           `default` and `isolate` name what exists, is `checkPlacement`'s (it needs the member list).
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decisions 2 and 3), ADR 0289 (decision 5).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { INSTANCES_SCHEMA } from "#core/constants/instances-schema.constant";
import { KEY_SCHEMA } from "#core/constants/key-schema.constant";
import { TopologyMode } from "#core/enums/topology-mode.enum";

/** Kubernetes-style memory: `512Mi`, `1Gi`. */
const MEMORY = z.string().regex(/^\d+(Mi|Gi)$/, "Expected memory such as 512Mi or 2Gi");

/** One environment's topology. */
export const TOPOLOGY_SCHEMA = z.strictObject({
  mode: z.enum(Enum.values(TopologyMode) as [TopologyMode, ...TopologyMode[]]),
  isolate: z.array(KEY_SCHEMA).optional(),
  default: KEY_SCHEMA.optional(),
  groups: z
    .record(
      KEY_SCHEMA,
      z.strictObject({
        members: z.array(KEY_SCHEMA).min(1),
        cpu: z.number().positive(),
        memory: MEMORY,
        instances: INSTANCES_SCHEMA,
        scaling: z
          .strictObject({
            metric: z.enum(["cpu", "memory"]),
            target: z.int().min(1).max(100),
          })
          .optional(),
        workers: z
          .strictObject({
            split: z.boolean(),
            cpu: z.number().positive().optional(),
            memory: MEMORY.optional(),
            instances: INSTANCES_SCHEMA.optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});
