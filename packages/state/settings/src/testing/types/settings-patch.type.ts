/**
 * Stackra file contract:
 * Purpose: `SettingsPatch<S>`, the values a test gives a settings class in `fakeSettings`: any of its fields, and any
 *          fields of a section, each typed as the class declares it.
 * Boundary: a type only. What a patch leaves out reads its default through the class's schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (testing helpers per package); ADR 0307 (rule 22: sections one level deep).
 */
import type { Fields } from "@stackra/validation";

/**
 * Some values of the settings class `S`.
 *
 * @example
 * const patch: SettingsPatch<OrdersSettings> = { cancellation: { customersMayCancel: false } };
 */
export type SettingsPatch<S> = {
  readonly [K in keyof Fields<S>]?: Fields<S>[K] extends Readonly<Record<string, unknown>>
    ? Partial<Fields<S>[K]>
    : Fields<S>[K];
};
