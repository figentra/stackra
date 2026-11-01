/**
 * Stackra file contract:
 * Purpose: `CacheClearCommand`, `cache:clear`: drops every entry of the current cache namespace through the `Cache`
 *          port's `flush`.
 * Boundary: destructive, so an interactive run confirms first and any other run needs `--force`, else it exits 2 naming
 *           the flag. It touches only the cache the host's `Cache` binding serves; there is one per process, so no
 *           store is chosen.
 * Runtime: node
 * Governing contract: STA-1731 spec FR-012 and FR-013; ADR 0506; ADR 0150.
 */
import { Command, Option, UsageError } from "@stackra/console";
import type { CommandIo } from "@stackra/console";

import type { Cache } from "#contracts/ports/cache.port";

/** Clears the cache. */
export class CacheClearCommand extends Command({
  name: "cache:clear",
  description: "Drop every cached entry",
}) {
  /** Skip the confirmation. */
  @Option({ description: "Clear without asking" })
  force = false;

  /** The cache to clear. */
  private readonly cache: Cache;

  /**
   * @param cache - the cache port.
   */
  constructor(cache: Cache) {
    super();
    this.cache = cache;
  }

  /** Clears the cache; returns whether it did. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    if (!this.force) {
      if (!io.interactive)
        throw new UsageError("cache:clear drops every cached entry", "Pass --force");
      const sure = await io.prompt.confirm({ message: "Drop every cached entry?", default: false });
      if (!sure) {
        io.output.warn("Cancelled; nothing was cleared");
        return { cleared: false };
      }
    }
    await io.output.task("Clearing the cache", () => this.cache.flush());
    io.output.success("Cache cleared");
    return { cleared: true };
  }
}
