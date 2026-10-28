/**
 * Stackra file contract:
 * Purpose: `changeCaptureOf`, which reads a model's `CapturesChanges` trait for @stackra/outbox's flush writer: whether
 *          its changes carry values, and every field whose value is dropped (the trait's `exclude`, the
 *          `HasEncryptedFields` fields and every `@Classified` field, the ones erasure reaches).
 * Boundary: reads the trait registry and the `@Classified` metadata; never instantiates the model.
 * Runtime: isomorphic
 * Governing contract: data-layer gaps cdc1 and cdc2; ADR 0096 (consequence: the trait registry); ADR 0134 (erasure).
 */
import type { AnyClass } from "@stackra/container";
import { Classified } from "@stackra/validation";

import { encryptedFieldsOf } from "#core/functions/encrypted-fields-of.function";
import { traitsOf } from "#core/functions/traits-of.function";
import type { ChangeCapture } from "#core/types/change-capture.type";

/**
 * The change capture of `type`.
 *
 * @returns undefined for a model without `CapturesChanges`.
 * @example
 * changeCaptureOf(Contact); // { values: true, dropped: Set { "cost", "email" } }
 */
export function changeCaptureOf(type: AnyClass): ChangeCapture | undefined {
  const trait = traitsOf(type).find((record) => record.name === "captures_changes");
  if (trait === undefined) return undefined;
  const classified = [...Classified.members(type).keys()].filter(
    (field): field is string => typeof field === "string",
  );
  return Object.freeze({
    values: trait.options["values"] === true,
    dropped: new Set([
      ...((trait.options["exclude"] as readonly string[] | undefined) ?? []),
      ...encryptedFieldsOf(type),
      ...classified,
    ]),
  });
}
