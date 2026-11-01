# Visual spec for a CLI outside Stackra (for Figentra Flow)

**Spec**: [spec.md](./spec.md) FR-033 · One page. Figentra Flow is independent and published on npmjs, so it does not
depend on `@stackra/console`. If it follows this page, a Flow terminal looks like a Stackra one.

## Layout (the same for every product)

- **Gutter**: every line starts with two spaces. Nothing is printed at column 0, except the error screen's blank
  lines.
- **Width**: lay out to the terminal width, never more than 100 columns. Without a terminal, use 80.
- **Message lines**: `␣␣<symbol>␣<text>`. Info and success go to stdout; warnings and errors go to stderr.

  | Role    | Unicode | ASCII | Colour          |
  | ------- | ------- | ----- | --------------- |
  | info    | `●`     | `*`   | accent          |
  | success | `✓`     | `+`   | `#3fb950`       |
  | warning | `▲`     | `!`   | `#d29922`       |
  | error   | `✕`     | `x`   | `#f85149`       |
  | bullet  | `•`     | `-`   | muted           |
  | muted   |         |       | `#8b949e` / dim |

- **Task line**: `␣␣<label>␣<dim dots to the width>␣<dim 123ms>␣DONE` (bold success colour), or `FAIL` (bold
  error colour, on stderr). It is written when the task ends, so nothing is redrawn.
- **Key-value**: `␣␣<key>␣<dim dots>␣<value>`.
- **Note box**: rounded corners `╭ ╮ ╰ ╯ ─ │` (ASCII `+ - |`), with the title set in the top edge (`╭─ Note ───╮`)
  and one space of padding. The edge colour is the accent for a note, warning for a warning, error for an alert.
- **Table**: bold header, a dim `─` rule under each column, three spaces between columns, padded by display width.
- **Error screen**: a blank line, then `␣␣ ERROR ␣<message>` with the badge in inverse error colour. Next comes the
  hint, dimmed, and under `--verbose` the stack and every `Caused by: …`. Then a blank line.
- **Prompt**: `␣␣● <question>` (accent mark, bold question), then `␣␣│ <field or choices>` with a `›` pointer on the
  current choice and `◼`/`◻` ticks. Last comes `␣␣└ <dim key hint or error>`. Once answered, it collapses to
  `␣␣✓ <question> <dim answer>`. A password never shows its characters.
- **Banner** (only on the command list, and only on a terminal): a blank line, then the ASCII logo coloured column
  by column across the gradient (the same column has the same colour on every line), then a blank line, then
  `␣␣<accent glyph> <bold name> <dim version>`, then a blank line.

## What a product changes

Only these: the name, the ASCII logo, two to five gradient stops, the accent, and the glyph (with an ASCII fallback).
Take the colours from the product's brand tokens (`brands/<id>/tokens/color.json`). Status colours never change.

## Modes

- **Colour depth**: none when `NO_COLOR` is set, with `--no-ansi`, without a TTY, or with `TERM=dumb`; `--ansi` or
  `FORCE_COLOR` turn it back on. 24-bit when `COLORTERM` is `truecolor` or `24bit`, otherwise 256. Quantise the
  gradient to the depth. Interpolate it in OKLab.
- **Plain** (no colour or no TTY): no escape byte at all and no cursor movement. A spinner prints one start line and
  one end line; progress prints at most once per 10 %.
- **ASCII** on `TERM=linux` or a non-UTF-8 locale.
- **No prompts** without a TTY, in CI (`CI` set), with `-n/--no-interaction`, or with `--json`. A prompt takes its
  default, or the run exits 2 naming the option that answers it.
- **`--json`**: exactly one document on stdout, `{"ok":true,"data":…}` or
  `{"ok":false,"error":{"code":"snake_case","message":"…"}}`, with no other output.
- **Exit codes**: 0 ok, 1 error, 2 usage, 130 SIGINT or a cancelled prompt, 143 SIGTERM.
- **Right-to-left text**: measure by grapheme cluster (wide East Asian characters and emoji take 2 columns, marks
  take 0). Never reverse characters yourself, and do not emit U+2068 … U+2069 isolates: many terminals draw them as boxes. On terminals without bidi or shaping
  (xterm.js based, iTerm2), write right-to-left runs shaped and in visual order, with an env override.

Reference implementation: `packages/developer/console` in stackra/core, which you can read but should not import.
