# Implementation Plan: validate allows the OS repo's strict JSON files

**Spec**: `spec.md` · **Linear**: STA-1794 · **Branch**: `figentra/sta-1794-must-stay-json-rows`

This Mac runs only oxfmt and oxlint; tests run on a box through stackra-8a.

| Step | What                                           | Gate                            |
| ---- | ---------------------------------------------- | ------------------------------- |
| 1    | Three `MUST_STAY_JSON` rows (four paths)       | `stackra validate --repository` |
| 2    | The paths in the `checkJsonConfigs` allow case | repo-checks tests               |
| 3    | os#22 and #27 validate against this core       | stackra-8a                      |
