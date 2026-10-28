/**
 * Stackra file contract:
 * Purpose: `@Visible({ audience })`, the serializer decorator naming the audiences a field reaches
 *          (`OutputAudience`: public, app, admin, agent); a field without it reaches every audience its shape does.
 * Boundary: made with `createDecorator`, so it records the options and installs no accessor. It checks the options
 *           when applied: at least one audience, each an `OutputAudience` code, none twice. The per-audience
 *           serializer that reads it is not built yet; `@Hidden` is the form gen enforces today. It may mark the
 *           shape kinds only.
 * Runtime: isomorphic
 * Governing contract: ADR 0095 (decision 6: `@Visible({ audience })`); ADR 0294 (decision 6 and R6).
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { Enum } from "@stackra/contracts";

import { SHAPE_KINDS } from "#core/constants/shape-kinds.constant";
import { OutputAudience } from "#core/enums/output-audience.enum";
import type { FieldDecorator } from "#core/types/field-decorator.type";
import type { VisibleOptions } from "#core/types/visible-options.type";

/** The recording decorator. */
const VISIBLE = createDecorator<VisibleOptions>({
  kind: "visible",
  target: DecoratorTarget.Field,
  kinds: SHAPE_KINDS,
});

/**
 * Names the audiences that see the field.
 *
 * @param options - the audiences, at least one.
 * @throws TypeError when `audience` is empty, repeats a code or holds one that is not an `OutputAudience`.
 * @example
 * ```ts
 * @Visible({ audience: [OutputAudience.App, OutputAudience.Admin] })
 * internalRating = 0;
 * ```
 */
export function Visible(options: VisibleOptions): FieldDecorator<unknown> {
  const { audience } = options;
  const codes = Enum.values(OutputAudience) as readonly string[];
  if (!Array.isArray(audience) || audience.length === 0)
    throw new TypeError("@Visible({ audience }) names at least one OutputAudience");
  if (new Set(audience).size !== audience.length)
    throw new TypeError(`@Visible({ audience }) names an audience twice: ${audience.join(", ")}`);
  for (const code of audience)
    if (!codes.includes(code))
      throw new TypeError(
        `@Visible({ audience }) takes OutputAudience codes (${codes.join(", ")}), got ${JSON.stringify(code)}`,
      );
  return VISIBLE(
    Object.freeze({ audience: Object.freeze([...audience]) }),
  ) as unknown as FieldDecorator<unknown>;
}

/** The audiences recorded on each field of a class and its ancestors. */
Visible.members = VISIBLE.members as (
  type: AnyClass,
) => ReadonlyMap<string | symbol, VisibleOptions>;
