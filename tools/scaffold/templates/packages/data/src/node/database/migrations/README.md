# database/migrations

Migrations of @stackra/{{NAME}}'s module: `NNNN-<name>.migration.ts`, numbered from `0001` with no gaps, each a class
that extends `Migration` with no `down()`, changing only this module's Postgres schema. `stackra db diff` writes
them; gen merges them into the host's ordered SQL (ADR 0294 decision 13, ADR 0159).
