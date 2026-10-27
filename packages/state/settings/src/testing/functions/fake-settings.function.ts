/**
 * Stackra file contract:
 * Purpose: `fakeSettings(entries)`, the one way a test fakes settings: a `SettingsFake` seeded with each class's
 *          values, to pass to `.override(SettingsReader, ...)` or to a render helper.
 * Boundary: a test helper. Each entry pairs a settings class with a patch typed by that class, so a mistyped field
 *           fails the type check; a field the patch leaves out reads its default.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (testing helpers per package); ADR 0263 (`.override(Port, fake)`).
 */
import type { AnyClass } from "@stackra/container";

import type { Settings } from "#core/index";
import { SettingsFake } from "#testing/settings.fake";
import type { SettingsPatch } from "#testing/types/settings-patch.type";

/**
 * A fake reader over the given values.
 *
 * @example
 * const app = await createTestingModule(OrdersModule)
 *   .override(SettingsReader, fakeSettings([[OrdersSettings, { cancellation: { customersMayCancel: false } }]]))
 *   .compile();
 */
export function fakeSettings<const T extends readonly Settings[]>(entries?: {
  readonly [I in keyof T]: readonly [AnyClass<T[I]>, NoInfer<SettingsPatch<T[I]>>];
}): SettingsFake {
  const fake = new SettingsFake();
  for (const [type, patch] of (entries ?? []) as readonly (readonly [AnyClass<Settings>, object])[])
    fake.set(type, patch as never);
  return fake;
}
