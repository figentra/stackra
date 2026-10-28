/**
 * Stackra file contract:
 * Purpose: `setGradleProperties`, which sets keys in the app's `android/gradle.properties` items: an existing key is
 *          replaced in place, a new one is appended.
 * Boundary: internal; pure: it returns new items and keeps every other line. The item shape is Expo's
 *           `PropertiesItem` (property, comment or empty line).
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2).
 */
import type { PropertiesItem } from "#plugin/types/properties-item.type";

/**
 * `items` with each of `entries` set.
 *
 * @example
 * setGradleProperties(items, { "stackra.cashDrawer.vendors": "sunmi,pax" });
 */
export function setGradleProperties(
  items: readonly PropertiesItem[],
  entries: Readonly<Record<string, string>>,
): PropertiesItem[] {
  const pending = new Map(Object.entries(entries));
  const next = items.map((item): PropertiesItem => {
    if (item.type !== "property" || !pending.has(item.key)) return item;
    const value = pending.get(item.key) ?? "";
    pending.delete(item.key);
    return { type: "property", key: item.key, value };
  });
  for (const [key, value] of pending) next.push({ type: "property", key, value });
  return next;
}
