/**
 * Stackra file contract:
 * Purpose: `MemoryPlayConsoleDriver`, the in-memory driver of the `PlayConsole` port: the Play apps live in a map.
 * Boundary: calls nothing outside the process. Seed `apps` to stand for what Play already has.
 * Runtime: node
 * Governing contract: ADR 0482 (decisions 4 and 6).
 */
import { Driver } from "@stackra/container";

import { PlayConsole } from "#core/ports/play-console.port";
import type { PlayApp } from "#core/types/play-app.type";

/**
 * Google Play in memory.
 *
 * @example
 * const play = new MemoryPlayConsoleDriver();
 * play.apps.set("com.figentra.commerce.staff", { hasRelease: true });
 */
export class MemoryPlayConsoleDriver extends Driver(PlayConsole) {
  /** Play apps by package name. */
  readonly apps = new Map<string, PlayApp>();

  /** The app of `packageName`, or `null`. */
  override async findApp(packageName: string): Promise<PlayApp | null> {
    return this.apps.get(packageName) ?? null;
  }
}
