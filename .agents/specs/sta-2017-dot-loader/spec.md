# Feature Specification: the dot loader in @stackra/ui (Spinner, ProgressBar, ProgressCircle, RouteProgress)

**Feature Branch**: `figentra/sta-2017-stackra-rebrand-c3-dot-loader-in-stackraui-spinner`

**Created**: 2026-11-02

**Status**: Accepted · owner's approval of the ADR 0303 exception, 2026-11-02

**Tier**: lite

**Approver**: leader

**Linear**: STA-2017

**Linear project**: none

**Clarifications status**: complete

**Input**:

- The owner, for the Stackra rebrand: "Instead of a circle or progress bar, it could be small dots building in the
  animation."
- The leader's decision of 2026-11-02:
  - the dots replace the shared Spinner, ProgressBar, ProgressCircle and RouteProgress in every theme;
  - the last dot takes the theme's emphasis role: the core for Stackra, the accent elsewhere.
- Brand rules §41 (figentra/brand#14, STA-2012) define the motion.

## Impact _(mandatory)_

- **Apps touched**: none directly. Every app's loaders change look through `@stackra/ui`.
- **Services touched**: none
- **Packages touched**:
  - `packages/design-system/ui`: the web and native `Spinner`, `ProgressBar`, `ProgressCircle` and `RouteProgress`,
    plus a shared core step function;
  - `packages/design-system/showcase`: the descriptions of these four entries.
- **Public contract change**: none. Every prop, default, size, tone, role, label and value attribute of the four
  contracts stays. Only the drawing changes. Snapshot or class-name dependents (HeroUI's `spinner--*`,
  `progress-bar__fill`, `progress-circle__*`) are internal; this repository's own tests change with them.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: an amending note on ADR 0303, in this change. The owner approved (2026-11-02, through the leader) an
  exception to decision 6, thin wrappers, for `Spinner`, `ProgressBar` and `ProgressCircle` only. They draw the dot
  loader and keep HeroUI's root semantics and the same props API. `RouteProgress` was already our own drawing. The
  components' file-contract docblocks cite the exception.
- **New dependencies**: none (React state and timers; `motion/react` and `react-native-reanimated` are already
  dependencies)
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT)
- **UI surfaces**: every spinner, progress bar, progress circle and route progress on web and native, in every theme
- **Docs to update**: the showcase descriptions of the four entries (EN and AR), and the generated API pages through
  the showcase
- **Lane**: lite
- **Change risk**: R2 (a shared visual changes in every product; no contract changes)

## The motion (brand rules §41)

- **Indeterminate.** A 3×3 cell of square dots builds the st tile's floors: the bottom row, then the middle, then the
  top.
  - Rows fill from the inline start, so in right-to-left they fill from the right.
  - Each dot takes 80 ms, as a whole step with no tween. The ninth dot is in the emphasis role.
  - The cell holds for 400 ms, then clears at once: a 1280 ms loop.
- **Determinate.** Dots fill one per value step from the inline start. The leading dot is in the emphasis role, the
  filled dots are in the tone, and the rest are a faint track.
- **Colours.**
  - The tone colours the built dots, as each component's tone does today.
  - With the default tone (`accent`), the last or leading dot is `var(--core, var(--accent))` on web. Stackra's theme
    shows its champagne core; every other theme shows its accent. On native it is the tone's colour until
    `@stackra/tokens` ships the native core colour (STA-2015; marked as a shortcut in the code).
  - With any other tone, every built dot is that tone.
  - Unfilled dots are the tone at low opacity.
- **Reduced motion.** When the system asks, or the `DesignSystemProvider` motion level is `reduced` or `none`:
  - the indeterminate cell shows complete and dimmed to 60 %, with no animation;
  - determinate states draw their value with no step animation.

## Requirements

- **FR-001** A pure core function returns the number of lit dots of an indeterminate build at an elapsed time, and the
  number of filled dots of a determinate value. It sits beside a constant holding the timing (80, 400 and 160 ms)
  and the dot sizes, with a unit test covering:
  - the loop length of 1280 ms for 9 dots and 800 ms for 3;
  - the step boundaries;
  - the clear;
  - clamped and empty ranges.
- **FR-002** `Spinner` (web and native) draws the 3×3 indeterminate cell at its contract diameters: `sm` 16, `md` 24,
  `lg` 32 px, with dots 4, 6 and 8 px and gaps 2, 3 and 4. It keeps the rest of its contract:
  - its tone mapping;
  - `label` naming one status (web `role="status"`; native `accessibilityLabel`), and hidden without a label;
  - its ref and pass-through props;
  - `style.color` overriding the tone.
- **FR-003** `ProgressBar` (web and native) keeps its root semantics and its label and value text. Web keeps HeroUI's
  React Aria `progressbar`, with its min, max, now and text. The track draws:
  - with a value, a row of dots filled to that value, the leading dot in the emphasis role;
  - without one, the indeterminate build moving along the row.
    The dot height is the contract's track height for the size (4, 8, 12 px). The dot count is 20, 16 or 10 (sm, md,
    lg), so each column is at least twice the dot at the bar's 10rem minimum width.
- **FR-004** `ProgressCircle` (web and native) keeps its semantics and its diameters (20, 28 and 36 px, from dots of
  4, 6 and 8 with gaps of 4, 5 and 6). Its 3×3 cell either fills in floor order
  to the value (nine steps), or runs the indeterminate build without one.
- **FR-005** `RouteProgress` (web and native) keeps its timing, fade and semantics. Its fill becomes a row of 2 px
  dots, filled to the trickle value, with the leading dot in the emphasis role.
- **FR-006** The fill order follows the reading direction: the inline start in right-to-left.
- **FR-007** Reduced motion, from the system or from the provider's motion level, follows "The motion" above on both
  runtimes. No timer runs while reduced.
- **FR-008** The showcase descriptions of the four entries (EN and AR) describe the dots. Their props and examples are
  unchanged.

## Success criteria

- **SC-001** Every existing assertion on props, roles, labels, value attributes, sizes, tones and pass-through still
  holds in the rewritten tests. Only the assertions on HeroUI's internal drawing (classes and the fill width) are
  replaced by assertions on the dots.
- **SC-002** The `@stackra/ui` web and native unit tests and typecheck pass on ci-box. `oxfmt` and `oxlint` are clean.
- **SC-003** In Stackra's theme the ninth dot is `--core`. In a theme without `--core` it is `--accent`.
