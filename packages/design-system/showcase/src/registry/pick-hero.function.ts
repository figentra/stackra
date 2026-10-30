/**
 * Stackra file contract:
 * Purpose: `pickHero`, the landing hero for a new visit: the one asked for by id, else the next one after the visitor's
 *          last hero, else a weighted random one, among the heroes running today.
 * Boundary: a pure function; the app keeps the pick for the rest of the visit and remembers it as the next visit's
 *           `last` on the device.
 * Runtime: isomorphic
 * Governing contract: owner decision 2026-10-28 (a random first hero, then each return visit the next in turn).
 */
import type { PickHeroInput } from "#src/types/pick-hero-input.type";

/** The id of the hero to show, or undefined when no hero is running. */
export function pickHero({
  heroes,
  now,
  random,
  last,
  override,
}: PickHeroInput): string | undefined {
  if (override && heroes.some(({ id }) => id === override)) return override;
  const today = now.toISOString().slice(0, 10);
  const running = heroes.filter(
    ({ weight = 1, from, until }) =>
      weight > 0 && (!from || from <= today) && (!until || today < until),
  );
  // A returning visitor sees the next hero in turn, so three visits show all three.
  const seen = running.findIndex(({ id }) => id === last);
  if (seen >= 0) return running[(seen + 1) % running.length]?.id;
  let left = random * running.reduce((sum, { weight = 1 }) => sum + weight, 0);
  return (running.find(({ weight = 1 }) => (left -= weight) < 0) ?? running.at(-1))?.id;
}
