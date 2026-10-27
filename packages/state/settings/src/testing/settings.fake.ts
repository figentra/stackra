/**
 * Stackra file contract:
 * Purpose: `SettingsFake`, the `SettingsReader` a test overrides the real one with: the real reader over a memory
 *          store seeded with the test's values, which also records every page write and takes new values mid-test
 *          (`set`).
 * Boundary: a test helper. `get` runs the real cascade and the class's registered schema, so a value the test leaves
 *           out reads its default exactly as in production; the seeded values sit at the root holder. A write is
 *           recorded before the reader checks it, so a test sees what the form asked for. `set` seeds like the
 *           constructor (root holder, no lock or schema check) and is not recorded as a write.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (testing helpers per package); ADR 0263 (`.override(Port, fake)`); ADR 0307 (rule 24).
 */
import type { AnyClass } from "@stackra/container";

import type { SettingTarget, SettingValue } from "#contracts/index";
import { MemorySettingValueStoreDriver, SettingsReader } from "#core/index";
import type { Settings, SettingsPage } from "#core/index";
import { settingsKeyOf } from "#core/functions/settings-key-of.function";
import type { SettingsPatch } from "#testing/types/settings-patch.type";
import type { SettingsWrite } from "#testing/types/settings-write.type";

/** A patch as flat paths, each field of a section as `<section>.<field>`. */
function flatten(patch: object): Record<string, SettingValue> {
  const out: Record<string, SettingValue> = {};
  for (const [name, value] of Object.entries(patch))
    if (typeof value === "object" && value !== null)
      for (const [field, inner] of Object.entries(value))
        out[`${name}.${field}`] = inner as SettingValue;
    else out[name] = value as SettingValue;
  return out;
}

/**
 * A reader over fixed values that records page writes.
 *
 * @example
 * const settings = new SettingsFake().set(OrdersSettings, { acceptingOrders: false });
 * await settings.get(OrdersSettings); // acceptingOrders: false, every other field its default
 */
export class SettingsFake extends SettingsReader {
  /** Every page write, in order. */
  readonly writes: SettingsWrite[] = [];

  /** The memory store the fake reads, kept so `set` can seed it mid-test. */
  private readonly memory: MemorySettingValueStoreDriver;

  /** Takes nothing (a constructor parameter is a DI token, ADR 0294 decision 17); `set` seeds each class. */
  constructor() {
    const store = new MemorySettingValueStoreDriver();
    super(store);
    this.memory = store;
  }

  /**
   * Gives `type` new values for the rest of the test, over what it held; the fields left out keep theirs.
   *
   * @returns this fake, to chain.
   * @example
   * settings.set(OrdersSettings, { acceptingOrders: false });
   */
  set<S extends Settings>(type: AnyClass<S>, patch: NoInfer<SettingsPatch<S>>): this {
    this.memory.seed(settingsKeyOf(type), flatten(patch));
    return this;
  }

  /** Records the write, then writes it as the real reader does. */
  override async write(
    page: SettingsPage,
    values: Readonly<Record<string, unknown>>,
    target: SettingTarget = {},
  ): Promise<void> {
    this.writes.push({ page, scope: page.scope, values: { ...values } });
    await super.write(page, values, target);
  }
}
