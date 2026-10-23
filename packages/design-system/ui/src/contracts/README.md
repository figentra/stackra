# src/contracts

The `./contracts` entry: the leaf of @stackra/ui (ADR 0294 decision 15). It holds `ports/` (abstract classes
that extend `Port`), `enums/` and `types/`, and imports nothing else from the package; `core/` builds on it.

`./contracts` names the stand-in barrel `index.ts` (the shared enums, the provider types and the props contracts of
Icon, Text, Heading, Button, IconButton, CloseButton and Link) until `stackra gen` writes the entry barrels (STA-339).
