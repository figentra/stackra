---
"@stackra/experience": minor
---

New landing block `experience.timeline_hero` (`TimelineHeroBlock`, `TimelineHero`): a hero for a product that follows
something from place to place. The `h1`, lede and primary action sit beside a window titled by the route's reference,
with the origin and destination over an ordered list of timed events (`TimelineEvent`: time, status, actor) named by
the route's label; the last event is marked `aria-current="step"`. An optional drawing sits under the actions.
