---
"@stackra/console": minor
"@stackra/validation": patch
"@stackra/gen": patch
"@stackra/coding-standard": patch
---

`@stackra/console` gains shared option sets: a class extending `OptionSet` declares `@Option` fields once, and each
command that takes them writes `@Options(SomeOptionSet) flags = new SomeOptionSet();`. The command keeps its own name,
its help lists each shared flag once, a run fills the set instance on the field, and a flag the set shares with another
option of the command is a `ConsoleDeclarationError`. `CommandField` gains an optional `set` (the command field holding
the set). The new kind `option_set` (`<name>.option-set.ts`, `<Name>OptionSet`) joins the field-carrying kinds of
`@stackra/validation`, gen's kind tables and the coding standard's `base-matches-suffix` table (STA-2924).
