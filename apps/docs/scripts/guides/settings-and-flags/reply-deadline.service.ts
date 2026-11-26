/**
 * Stackra file contract:
 * Purpose: `ReplyDeadlineService`, the example service of the "Settings and feature flags" guide: when the first answer
 *          to a ticket is due, read from the support settings of the tenant the call acts in.
 * Boundary: reads settings only; the scope comes from the running call (`ctx.scope`), never from input.
 * Runtime: node
 * Governing contract: ADR 0213; ADR 0307 (rule 23: code reads the resolved group); ADR 0327 (the call's scope);
 *                     STA-2852.
 */
import { Service } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";
import type { SettingsReader } from "@stackra/settings";

import { SupportSettings } from "./support.settings";

/** One hour, in milliseconds. */
const HOUR = 3_600_000;

/** First-reply deadlines. */
export class ReplyDeadlineService extends Service {
  /** Reads the resolved settings. */
  private readonly settings: SettingsReader;

  /**
   * @param settings - reads the resolved settings.
   */
  constructor(settings: SettingsReader) {
    super();
    this.settings = settings;
  }

  /** When the first answer to a ticket opened at `openedAt` in `scope` is due. */
  async dueAt(openedAt: Date, scope: ScopeRef): Promise<Date> {
    const { firstReplyHours } = await this.settings.get(SupportSettings, { scope });
    return new Date(openedAt.getTime() + firstReplyHours * HOUR);
  }
}
