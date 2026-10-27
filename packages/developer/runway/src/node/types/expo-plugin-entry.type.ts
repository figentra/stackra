/**
 * Stackra file contract:
 * Purpose: `ExpoPluginEntry`, one entry of an Expo config's `plugins`: the plugin's name, or its name and options.
 * Boundary: type only; the template's capability catalogue and the generated Expo config use it.
 * Runtime: node
 * Governing contract: ADR 0439 (decision 3: capabilities run their config plugins).
 */

/** An Expo config plugin entry. */
export type ExpoPluginEntry = string | readonly [name: string, options: unknown];
