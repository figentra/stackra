/**
 * Stackra file contract:
 * Purpose: `TOPOLOGY_SCHEMA`, the `topology` of one root runway environment: the mode (required), the members that
 *          keep their own database server and network policy (`isolate`), the `default` group, and each group's
 *          members (required, each once) with its optional cpu, memory, instances, scaling rule and split workers.
 * Boundary: internal; the shape only. A grouped topology needs `groups`, and a list names a member once: the canonical
 *           `if`/`then` and `uniqueItems`, stated here as refinements. That each member of a grouped environment sits
 *           in exactly one group, and that `default` and `isolate` name what exists, is `checkPlacement`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decisions 2 and 3, and its 2026-10-24 note), ADR 0289 (decision 5).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { INSTANCES_SCHEMA } from "#core/constants/instances-schema.constant";
import { TopologyMode } from "#core/enums/topology-mode.enum";

/** Kubernetes-style memory: `512Mi`, `1.5Gi`. */
const MEMORY = z
  .string()
  .regex(/^[0-9]+(\.[0-9]+)?(Mi|Gi)$/, "Expected memory such as 512Mi or 2Gi");

/** Member keys, each once. */
const MEMBERS = z
  .array(z.string())
  .refine(
    (members) => new Set(members).size === members.length,
    "A member is listed more than once",
  );

/** One environment's topology. */
export const TOPOLOGY_SCHEMA = z
  .strictObject({
    mode: z.enum(Enum.values(TopologyMode) as [TopologyMode, ...TopologyMode[]]),
    isolate: MEMBERS.optional(),
    default: z.string().optional(),
    groups: z
      .record(
        z.string(),
        z.strictObject({
          members: MEMBERS,
          cpu: z.number().positive().optional(),
          memory: MEMORY.optional(),
          instances: INSTANCES_SCHEMA.optional(),
          scaling: z
            .looseObject({ metric: z.string().optional(), target: z.number().optional() })
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
  })
  .refine((topology) => topology.mode !== TopologyMode.Grouped || topology.groups !== undefined, {
    message: "A grouped topology needs `groups`",
    path: ["groups"],
  });
