# @stackra/support

Dependency-free pure helpers for Stackra packages and services, grown on demand. Today it holds `time`; string,
array, async and object helpers are added when a package first needs them, not before.

**Tier:** `tier:lib` (`packages/foundation/support`). Laid out in the programming model v3.1 (ADR 0294, 0305).
No workspace dependency, no runtime dependency, no host globals: it runs unchanged in Node, Encore, browsers,
workers and React Native.

## Entry points

| Import             | Holds                        | Exports today                                  |
| ------------------ | ---------------------------- | ---------------------------------------------- |
| `@stackra/support` | `src/core/`: isomorphic code | `time` (`src/core/constants/time.constant.ts`) |

The package has the one entry `.` (ADR 0127, 2026-10-24 note). Entry barrels are generated, never authored
(ADR 0294 decision 15); until `stackra gen` writes them (STA-339) the export names the entry's one public file.

## `time`

Fixed-length shifts of an instant. Each helper takes a `Date` and an amount, returns a new `Date` and never mutates
its input. Units are exact lengths on the UTC timeline (a day is 86,400 s), so a daylight-saving change in a local
zone never stretches or shrinks a day.

```ts
import { time } from "@stackra/support";

const cutoff = time.subMinutes(ctx.now(), settings.autoCancelAfterMinutes);
const expiresAt = time.addDays(issuedAt, 30);
```

| Helper                     | Unit                 |
| -------------------------- | -------------------- |
| `addSeconds`, `subSeconds` | 1,000 ms             |
| `addMinutes`, `subMinutes` | 60 s                 |
| `addHours`, `subHours`     | 3,600 s              |
| `addDays`, `subDays`       | 86,400 s (a UTC day) |

- A negative amount shifts the other way; a fractional amount is truncated to whole milliseconds.
- An invalid `Date` or a non-finite amount throws a `RangeError`, so `Invalid Date` never reaches a query.
- The helpers never read the clock: the current time comes from the caller (the `Clock` port of
  `@stackra/contracts`, or `ctx.now()` in an action).
- Calendar months and years are not offered: they need a time zone and a clamping rule.

## Tasks

| Task            | Command                                         |
| --------------- | ----------------------------------------------- |
| `build`         | `tsdown`                                        |
| `typecheck`     | `tsc --noEmit`                                  |
| `lint`          | `oxlint .`                                      |
| `test`          | `vitest run`                                    |
| `test:coverage` | `vitest run --coverage` (shared gate: 80/80/70) |
| `format`        | `oxfmt --write .`                               |
| `format:check`  | `oxfmt --check .`                               |
| `clean`         | `rm -rf dist coverage .turbo`                   |

Run one with `pnpm turbo run <task> --filter=@stackra/support`.
