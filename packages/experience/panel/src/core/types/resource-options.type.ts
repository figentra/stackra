/**
 * Stackra file contract:
 * Purpose: `ResourceOptions`, what `Resource<M, R?>({ ... })` takes: the area, the navigation entry, the operations and
 *          whether quick create is offered.
 * Boundary: a type only. A resource lives in one area, so it is mounted in the panel hosting that area.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 4 and 21: quick create is opt-in); ADR 0082 (API areas); ADR 0164.
 */
import type { ApiArea } from "@stackra/contracts";

import type { PanelNavigation } from "#core/types/panel-navigation.type";
import type { ResourceOperations } from "#core/types/resource-operations.type";

/** The options of a resource. */
export interface ResourceOptions {
  /** The API area whose panel hosts it. */
  readonly area: ApiArea;

  /** Its navigation entry; absent for a resource reached only by links. */
  readonly navigation?: PanelNavigation;

  /** Its operations. */
  readonly operations: ResourceOperations;

  /** Whether the panel offers a quick-create dialog for it. */
  readonly quickCreate?: boolean;
}
