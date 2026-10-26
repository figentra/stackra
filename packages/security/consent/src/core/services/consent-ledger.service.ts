/**
 * Stackra file contract:
 * Purpose: `ConsentLedger`, the one place consent is decided and read: the status of each category for the current
 *          visitor, the writes that change it, and the subscription `useConsent` and the analytics package watch.
 * Boundary: a singleton service over the selected `ConsentStore`. The order of the rules is fixed: a required
 *           category is granted; Global Privacy Control refuses every other one; then the stored decision, when it
 *           answers the current policy version and has not expired; then the regime of the visitor's region (opt-out
 *           grants a `defaultGranted` category), and otherwise undecided, which runs nothing. A category the
 *           configuration does not list follows the same rules as an optional one. It never sends anything itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 to 4 and 6); ADR 0294 (decisions 16 and 17).
 */
import { Service } from "@stackra/container";

import type { ConsentConfig } from "#config/consent.config";
import type { ConsentStore } from "#contracts/ports/consent-store.port";
import type { ConsentRecord } from "#contracts/types/consent-record.type";
import type { ConsentCategory } from "#core/enums/consent-category.enum";
import { ConsentRegime } from "#core/enums/consent-regime.enum";
import { ConsentStatus } from "#core/enums/consent-status.enum";
import { hasGlobalPrivacyControl } from "#core/functions/has-global-privacy-control.function";

/** Milliseconds in a day, for the decision's expiry. */
const DAY_MS = 86_400_000;

/**
 * Reads and records the visitor's consent.
 *
 * @example
 * ledger.status(ConsentCategory.Analytics); // "undecided" until the visitor answers
 * ledger.set(ConsentCategory.Analytics, true);
 * ledger.isGranted(ConsentCategory.Analytics); // true, unless the browser sends Global Privacy Control
 */
export class ConsentLedger extends Service {
  /**
   * Calls `listener` after every change; returns the function that stops it.
   *
   * @example
   * const stop = ledger.subscribe(() => render(ledger.isGranted(ConsentCategory.Analytics)));
   */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private readonly config: ConsentConfig;

  private readonly store: ConsentStore;

  private readonly listeners = new Set<() => void>();

  private region: string | null = null;

  private changes = 0;

  /**
   * @param config - the categories, the policy version, the expiry and the regional defaults.
   * @param store - the selected driver that keeps the decision.
   */
  constructor(config: ConsentConfig, store: ConsentStore) {
    super();
    this.config = config;
    this.store = store;
  }

  /** How many changes this ledger has made or seen; a new value means a status may have changed. */
  get revision(): number {
    return this.changes;
  }

  /** Where `category` stands for the current visitor. */
  status(category: ConsentCategory): ConsentStatus {
    if (this.isRequired(category)) return ConsentStatus.Granted;
    if (hasGlobalPrivacyControl()) return ConsentStatus.Denied;
    const stored = this.current()?.categories[category];
    if (stored !== undefined) return stored ? ConsentStatus.Granted : ConsentStatus.Denied;
    const entry = this.config.categories.find((item) => item.category === category);
    return this.regime() === ConsentRegime.Ccpa && entry?.defaultGranted
      ? ConsentStatus.Granted
      : ConsentStatus.Undecided;
  }

  /** Whether the configuration marks `category` required: always granted, never asked and never stored. */
  isRequired(category: ConsentCategory): boolean {
    return this.config.categories.some((item) => item.category === category && item.required);
  }

  /** Whether the work `category` gates may run now. */
  isGranted(category: ConsentCategory): boolean {
    return this.status(category) === ConsentStatus.Granted;
  }

  /**
   * Records the visitor's choice for `category` under the current policy version, keeping their other current
   * choices; the decision's expiry restarts. A required category cannot be refused, so nothing happens for one.
   * Under Global Privacy Control the choice is kept but every optional category still reads as refused.
   */
  set(category: ConsentCategory, granted: boolean): void {
    if (this.isRequired(category)) return;
    const categories = { ...this.current()?.categories, [category]: granted };
    this.store.write({
      policyVersion: this.config.policyVersion,
      decidedAt: new Date().toISOString(),
      categories,
    });
    this.notify();
  }

  /**
   * Forgets the choice for `category`, or every choice when no category is given, so it reads as before a decision
   * and the banner asks again.
   */
  reset(category?: ConsentCategory): void {
    const record = this.current();
    if (category === undefined || record === null) {
      this.store.clear();
    } else {
      const { [category]: _forgotten, ...categories } = record.categories;
      if (Object.keys(categories).length === 0) this.store.clear();
      else this.store.write({ ...record, categories });
    }
    this.notify();
  }

  /**
   * Sets the visitor's region (a code `ConsentConfig.regionDefaults` lists, such as `US`), whose regime applies before
   * a decision; `null` uses the `default` entry. The host calls it once it knows the region.
   */
  setRegion(region: string | null): void {
    if (region === this.region) return;
    this.region = region;
    this.notify();
  }

  /** The stored decision when it answers the current policy version and has not expired, else `null`. */
  private current(): ConsentRecord | null {
    const record = this.store.read();
    if (record === null || record.policyVersion !== this.config.policyVersion) return null;
    const decidedAt = Date.parse(record.decidedAt);
    if (Number.isNaN(decidedAt) || decidedAt + this.config.expiryDays * DAY_MS <= Date.now())
      return null;
    return record;
  }

  /** The regime before a decision: the region's, else the `default` entry's, else opt-in (decline by default). */
  private regime(): ConsentRegime {
    const defaults = this.config.regionDefaults;
    return (
      (this.region === null ? undefined : defaults[this.region]) ??
      defaults.default ??
      ConsentRegime.Gdpr
    );
  }

  /** Counts a change and tells every listener. */
  private notify(): void {
    this.changes += 1;
    for (const listener of this.listeners) listener();
  }
}
