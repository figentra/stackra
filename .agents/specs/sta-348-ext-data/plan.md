# Plan: data packages, wave 10 extensions

**Spec**: `.agents/specs/sta-348-ext-data/spec.md`

## Design

- Legal holds follow the `VisibilityFilter` seam: a port in `./contracts`, a process-wide host set by a `connect*`
  function, and one internal question (`disposableIds`) every disposal path asks. Unit-of-work deletes go through an
  ORM subscriber (`beforeDelete`), bulk purges through `CrudService.purge`, which deletes only the checked ids.
- Collations are a schema operation compiled with the module schema, and a column records its collation name.
- Search applies visibility in SQL through the ORM-built key subquery (`visibleKeysQuery`), so ranking never sees an
  invisible row; the memory engine refuses rather than leak.
- Model additions are markers and fields only (ADR 0294 decision 27); behaviour stays with the owning packages.
- New drivers are selected by config enums (`filesystem.disk: gcs`, `media.scanner`), each with its shipped schema
  default, so runway chooses per environment.
- Content scheduling stores the schedule on the revision row; `@stackra/scheduler` only calls `publishDue`.
