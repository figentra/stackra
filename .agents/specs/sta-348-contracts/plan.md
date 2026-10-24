# Plan: `@stackra/contracts` wave 1a

**Spec**: `.agents/specs/sta-348-contracts/spec.md`

## Design

- One entry, `.`, from `src/core/` through the stand-in barrel `src/core/index.ts` (STA-339 replaces it). No
  `src/contracts/` folder: it would become a `./contracts` entry.
- Groups: `bases/` (`Port`, `Enum`), `enums/`, `ports/`, `types/`, `constants/` (`Duration`), `functions/` (`brand`,
  the four `define*`). One declaration per file.
- `Enum` is an abstract class with static `of`, `values`, `meta` and a merged type-only namespace (`Enum.Value`,
  `Enum.Of`, …). Case data lives in a module `WeakMap` keyed by the frozen enum object; the type carries it under a
  type-only `~enum` key, so a case is a plain code.
- `Port` is an abstract class with a `declare`d `~kind: "port"` brand and nothing else (no constructor state).
- `Duration` is a branded `P${string}` ISO 8601 string in canonical form (days, then `T` hours, minutes, seconds with
  a millisecond fraction; zero is `PT0S`), built and read by a frozen namespace object.
- `Actor` is a union on `kind`: a user has `realm` and a `usr` id; every other kind has no realm, so a realm check
  narrows the id.
- `PublicId`, `Email` and `Url` are template-literal types, so literal defaults read naturally; `Branded` records its
  base so `brand<B>()` takes exactly it.
- `define*` are typed identity functions; gen reads the argument from the syntax tree.

## Constitution check

- Boundaries: no workspace runtime import; dev-only `@stackra/testing` and the tooling presets.
- Versions: catalogs and `workspace:*` only.
- Naming: kind bases `PascalCase(kind)`; `define` only for the four member helpers (0305 rule 3).

## Properties

- **P-001**: For every enum, `Enum.values(X)` equals the codes of `Object.values(X)` in source order.
- **P-002**: For every non-negative finite `n`, `Duration.parse(Duration.seconds(n)) === Duration.seconds(n)` and
  `Duration.toMilliseconds(Duration.seconds(n)) === Math.round(n * 1000)`.
