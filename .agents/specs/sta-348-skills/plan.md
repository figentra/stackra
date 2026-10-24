# Plan: `@stackra/skills`

**Spec**: `.agents/specs/sta-348-skills/spec.md`

## Design

- `.` is isomorphic: `parseAgentDocument(kind, text, source)` splits the frontmatter (`yaml`, duplicate keys refused),
  checks it with the kind's strict zod schema (`FRONT_MATTER_SCHEMAS`, internal), derives the name from the path
  (`documentName`, internal) and returns a frozen document typed for its kind.
- `./node` reads files: `loadSkillSet(root?)` walks `skills/<name>/SKILL.md` and `rules|subagents|commands|hooks/*.md`
  (`KIND_FOLDERS`, internal), skipping `README.md`. The default root is the package's `assets/`, found by walking up to
  the nearest `package.json` (`bundledRoot`, internal), so it holds from `src/` and from `dist/`.
- Errors are a plain `Error` (`AgentDocumentInvalidError`), like `RunwayInvalidError`: a bad document is an author's
  mistake found before anything is written.
- Content: the Stackra-authored open conventions copied from `.agents/` (rules: naming-and-casing, module-boundary,
  http-conventions, not-built-yet, versions, tenancy, service-checklist; skills: the ten v3 authoring skills). Rule
  frontmatter is normalised (`applies_to` to `globs`, `manual` dropped: a rule with neither `always` nor `globs` is on
  request).

## Constitution check

- Boundaries: depends on `@stackra/contracts` (`Enum`, `definePackage`), `yaml`, `zod`; no app, service or
  `encore.dev`; `.` has no `node:*` import.
- Versions: catalogs and `workspace:*` only.
- Naming: kind codes snake_case/kebab per ADR 0231; files `<name>.<kind>.ts`.

## Properties

- **P-001**: `loadSkillSet` on the same root returns the same order every time.
- **P-002**: Every shipped document parses (the bundled-set test).
