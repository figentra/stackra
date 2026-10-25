/**
 * Stackra file contract:
 * Purpose: `parseInfraRunway(root)`, the root runway narrowed to what the GCP foundation reads, or every invalid path.
 * Boundary: internal; the root has already passed `@stackra/runway`'s schema, whose provider blocks stay open, so this
 *           checks only the keys infra-gcp reads. Failures reuse runway's `RunwayInvalidError`: the root runway is
 *           what is wrong.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (enforcement), ADR 0354 (decision 4).
 */
import { RunwayInvalidError } from "@stackra/runway";
import type { RootRunway } from "@stackra/runway";

import { INFRA_RUNWAY_SCHEMA } from "#core/constants/infra-runway-schema.constant";
import { ROOT_SOURCE } from "#core/constants/root-source.constant";
import type { InfraRunway } from "#core/types/infra-runway.type";

/**
 * The narrowed root runway.
 *
 * @throws RunwayInvalidError naming every invalid path (`providers.gcp.region`, an unquoted project number, …).
 */
export function parseInfraRunway(root: RootRunway): InfraRunway {
  const result = INFRA_RUNWAY_SCHEMA.safeParse(root);
  if (result.success) return result.data;
  throw new RunwayInvalidError(
    ROOT_SOURCE,
    result.error.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      message: issue.message,
    })),
  );
}
