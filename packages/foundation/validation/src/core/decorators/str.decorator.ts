/**
 * Stackra file contract:
 * Purpose: `@Str(options)`, the constraint decorator of a string field: length bounds, a pattern and the message key
 *          of a failure; with `each: true`, the rules of each item of a `string[]`.
 * Boundary: made with `createDecorator`, so it records its options and installs no accessor; gen reads the literal
 *           options from source and compiles them into `X$`. Typed against its field, so tsc refuses it on a field
 *           that is not a string (or a string array with `each`). It may mark the shape kinds only.
 *           Written bare (`@Str`) when it has no options (ADR 0294 R6 bans `@Str()`): legacy decorators then call it
 *           with the prototype and the field name, and it records `{}`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6 and 26); ADR 0095 as amended.
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";

import { SHAPE_KINDS } from "#core/constants/shape-kinds.constant";
import type { FieldDecorator } from "#core/types/field-decorator.type";
import type { StrOptions } from "#core/types/str-options.type";
import type { TranslatedStrings } from "#core/types/translated-strings.type";

/** The recording decorator; `Str` gives it its options. */
const STR = createDecorator<StrOptions>({
  kind: "str",
  target: DecoratorTarget.Field,
  kinds: SHAPE_KINDS,
});

/**
 * Constrains a string field, or each item of a string array with `each: true`.
 *
 * @example
 * ```ts
 * @Str({ min: 2, max: 120, message: I18n.web.contact.errors.name })
 * name!: string;
 *
 * @Str({ pattern: /^\d{4}-\d{2}-\d{2}$/, each: true })
 * supported = ["2026-10-01"];
 * ```
 */
export function Str(
  options: StrOptions & { readonly each: true },
): FieldDecorator<readonly string[]>;
/** The single-value form: `@Str(options)` on a string field, or on a translated field (each locale's string). */
export function Str(options?: StrOptions): FieldDecorator<string | TranslatedStrings>;
/** The bare form: `@Str` on a string field, with no options. */
export function Str<K extends string, O extends { [P in K]?: string | TranslatedStrings | null }>(
  target: O,
  property: K,
): void;
/** Implementation of every form: records `options` on the field, or `{}` when written bare. */
export function Str(options: StrOptions | object = {}, property?: string | symbol): unknown {
  // Bare `@Str`: the first argument is the prototype and the second the field name.
  if (property !== undefined) return STR({})(options, property);
  return STR(options as StrOptions);
}

/** The options recorded on each field of a class and its ancestors. */
Str.members = STR.members;
