/**
 * Stackra file contract:
 * Purpose: the stand-in for what `stackra gen` writes for the guide's `projects` module in an app: the `Project`
 *          entity metadata (`.stackra/gen/entities/projects.ts`, in gen's exact shape) and the `ProjectService`
 *          partner registration (the generated test setup), so the guide's tests run the example files unchanged.
 * Boundary: test support only; loading it registers the entity and the partner. Columns, indexes and keys are the
 *           migrations'.
 * Runtime: node (vitest)
 * Governing contract: ADR 0294 (decision 15: gen writes the entities); ADR 0305 (partners); STA-2843.
 */
import {
  EntitySchema,
  type OptionalProps,
  registerEntities,
  registerModelPartners,
} from "@stackra/database";

import { Project } from "../project.model";
import { ProjectService } from "../project.service";

declare module "../project.model" {
  interface Project {
    [OptionalProps]?:
      | "createdAt"
      | "deletedAt"
      | "dueOn"
      | "estimateDays"
      | "id"
      | "status"
      | "updatedAt";
  }
}

/** `projects.project` (project.model.ts). */
export const ProjectSchema = new EntitySchema<Project>({
  class: Project,
  schema: "projects",
  tableName: "projects",
  properties: {
    name: { type: "string" },
    status: { type: "string", default: "active" },
    dueOn: { type: "datetime", nullable: true },
    estimateDays: { type: "integer", nullable: true },
    id: { type: "string", primary: true },
    createdAt: { type: "datetime" },
    updatedAt: { type: "datetime", onUpdate: () => new Date() },
    deletedAt: { type: "datetime", nullable: true },
  },
});

registerEntities([ProjectSchema]);
registerModelPartners([[ProjectService, Project]]);
