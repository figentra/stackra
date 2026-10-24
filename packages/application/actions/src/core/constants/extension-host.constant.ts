/**
 * Stackra file contract:
 * Purpose: `EXTENSION_HOST`, the app the slots read extension instances from and its inline implementers, as
 *          `connectExtensions` last set them.
 * Boundary: process-wide and internal: one booted app per process in production; the testing module reconnects it on
 *           every compile, so inline implementers never leak from one test module to the next.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 23 and 25); ADR 0269 (decision 3).
 */
import type { InlineExtension } from "#core/types/inline-extension.type";
import type { Resolver } from "#core/types/resolver.type";

/** The connected app and its inline implementers. */
export const EXTENSION_HOST: {
  resolver: Resolver | undefined;
  inline: readonly InlineExtension[];
} = { resolver: undefined, inline: [] };
