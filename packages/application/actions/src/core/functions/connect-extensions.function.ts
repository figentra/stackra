/**
 * Stackra file contract:
 * Purpose: `connectExtensions`, which names the app the slots read extension instances from, with the inline
 *          implementers that belong to it; the runtime calls it once at boot, the testing module on every compile.
 * Boundary: replaces the previous connection (and its inline implementers) whole. A slot with registered extensions
 *           and no connected app refuses to run, so a forgotten connection never silently skips an extension.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 23 and 25); ADR 0269 (decision 3).
 */
import { EXTENSION_HOST } from "#core/constants/extension-host.constant";
import type { InlineExtension } from "#core/types/inline-extension.type";
import type { Resolver } from "#core/types/resolver.type";

/**
 * Connects the slots to an app.
 *
 * @param resolver - the booted container or testing app; a registered extension it does not bind is skipped.
 * @param inline - function implementers for this app only.
 * @example
 * const container = await Container.create(wirings);
 * connectExtensions(container);
 */
export function connectExtensions(
  resolver: Resolver,
  inline: readonly InlineExtension[] = [],
): void {
  EXTENSION_HOST.resolver = resolver;
  EXTENSION_HOST.inline = Object.freeze([...inline]);
}
