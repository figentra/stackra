/**
 * Stackra file contract:
 * Purpose: `ProjectService`, the example service of the "Models and migrations" guide: the standard reads and writes
 *          of `Project` rows from `CrudService`, plus the two reads and the one write the projects module needs.
 * Boundary: runs inside the caller's transaction (the action's unit of work); the model comes from the registered
 *           partner, which gen writes for an app.
 * Runtime: node
 * Governing contract: ADR 0105 as amended by ADR 0294 (`CrudService`); ADR 0305 (partners); STA-2843.
 */
import { SortDirection } from "@stackra/contracts";
import { CrudService } from "@stackra/database";

import type { Project } from "./project.model";

/** The projects module's reads and writes. */
export class ProjectService extends CrudService<Project> {
  /** The active projects due before `cutoff`, soonest first. */
  dueBefore(cutoff: Date): Promise<Project[]> {
    return this.find(
      { status: "active", dueOn: { $lt: cutoff } },
      { orderBy: { dueOn: SortDirection.Asc } },
    );
  }

  /** Closes a project; a stale or missing id refuses with `not_found`. */
  close(id: Project["id"]): Promise<Project> {
    return this.update({ id }, { status: "closed" });
  }
}
