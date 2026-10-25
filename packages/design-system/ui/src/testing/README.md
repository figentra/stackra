# src/testing

The `./testing` entry of @stackra/ui (ADR 0294 decision 15): `fakes/` for this package's ports and
`matchers/` for consumers' tests. It may import every other entry; production code never imports it.

The entry is exported: until gen ships (STA-339) the `./testing` export names the entry's one public file,
`fakes/fake-confirmation-provider.tsx` (`FakeConfirmationProvider`); its second public file adds the stand-in barrel
(see `AGENTS.md`).
