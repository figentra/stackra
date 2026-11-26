/**
 * Stackra file contract:
 * Purpose: `@Collaborative({ view, edit })`, the class facet by which a model declares that its records have live rooms:
 *          a caller who may `view` a record joins its room, one who may `edit` it also publishes document updates.
 * Boundary: made with `createDecorator`, so it records its options on the class; it also registers the model under its
 *           public-id prefix in `COLLABORATIVE_MODELS`, which is how the room-token action finds a document's model
 *           from its id alone. It may mark a model only, and the model needs `HasPublicId`.
 * Runtime: node
 * Governing contract: ADR 0346 (decision 3); ADR 0270 (decision 6: the collaboration level is the document kind's);
 *                     ADR 0294 (decision 6: class facets).
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { AnyClass, DecoratorFunction } from "@stackra/container";
import { traitsOf } from "@stackra/model";

import { COLLABORATIVE_MODELS } from "#node/constants/collaborative-models.constant";
import type { CollaborativeOptions } from "#node/types/collaborative-options.type";

/** The recording decorator; `Collaborative` gives it its options. */
const COLLABORATIVE = createDecorator<CollaborativeOptions>({
  kind: "collaborative",
  target: DecoratorTarget.Class,
  kinds: ["model"],
});

/**
 * Declares a model collaborative.
 *
 * @throws TypeError at class definition when applied to anything but a model class, or to a model without
 *         `HasPublicId`.
 * @example
 * ```ts
 * @Collaborative({ view: TemplatePermissions.read, edit: TemplatePermissions.update })
 * export class Template extends Model.with(HasPublicId("tpl"), BelongsToTenant) {}
 * ```
 */
export function Collaborative(options: CollaborativeOptions): DecoratorFunction {
  const value = Object.freeze({ view: options.view, edit: options.edit });
  const record = COLLABORATIVE(value);
  return ((target: AnyClass) => {
    record(target);
    const prefix = traitsOf(target).find((trait) => trait.name === "has_public_id")?.options[
      "prefix"
    ];
    if (typeof prefix !== "string")
      throw new TypeError(
        `@collaborative: ${(target as { name?: string }).name ?? "the model"} needs HasPublicId, since a room is keyed by its record's public id`,
      );
    COLLABORATIVE_MODELS.set(prefix, { model: target, ...value });
  }) as DecoratorFunction;
}

/** The options declared on a class or its nearest decorated ancestor; undefined when it has none. */
Collaborative.on = COLLABORATIVE.on;
