# Implementation Plan: consumers resolve no advisory through data-transfer, app or navigation

**Spec**: `spec.md` · **Linear**: STA-1736 · **Branch**: `figentra/sta-1736-osv-data-transfer-peers`

This Mac runs only oxfmt and oxlint; install, tests and OSV run on a box through stackra-f4.

| Step | What                                                                                       | Gate                      |
| ---- | ------------------------------------------------------------------------------------------ | ------------------------- |
| 1    | `react-router: ^7.18.4` peer in app and navigation, with a changeset                       | lockcheck, validate       |
| 2    | XLSX reader and writer on fflate with a small OOXML reader; exceljs out of data-transfer   | data-transfer tests       |
| 3    | Drop the exceljs catalog and the `uuid@<11.1.1` override once no lockfile entry matches it | install, OSV on core main |
