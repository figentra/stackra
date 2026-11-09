/**
 * Stackra file contract:
 * Purpose: `CollaborativeOptions`, what `@Collaborative` takes: the permission that lets a caller join a model's
 *          document rooms (`view`) and the one that lets it publish edits there (`edit`).
 * Boundary: a type only. Each is a `Permission` static of the model's permission set or its locked key; the key is
 *           read when a token is issued, after gen's entry registered the permissions.
 * Runtime: node
 * Governing contract: ADR 0346 (decision 3: the endpoint resolves view and edit); ADR 0294 (decision 6: class facets).
 */
import type { Permission } from "@stackra/contracts";

/** A collaborative model's two rights. */
export interface CollaborativeOptions {
  /** Joins the room of a record, as a viewer (`TemplatePermissions.read`). */
  readonly view: Permission | string;

  /** Publishes document updates in that room (`TemplatePermissions.update`). */
  readonly edit: Permission | string;
}
