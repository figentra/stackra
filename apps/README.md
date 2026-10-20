# `apps/`

The deployable front ends, one workspace member each, tagged `tier:app`. They are reference apps that prove the
packages, not products ([ADR 0075](docs/src/adr/0075-stackra-ships-packages-figentra-os-ships-services.mdx)).

| App                  | Package             | What it is                                                                                 | Run            |
| -------------------- | ------------------- | ------------------------------------------------------------------------------------------ | -------------- |
| [`console`](console) | `@figentra/console` | the operator and admin web console; for now a single `src/main.ts` entry                   | `pnpm console` |
| [`mobile`](mobile)   | `@figentra/mobile`  | the iOS and Android app: Expo SDK 57, code-based React Navigation, HeroUI Native + Uniwind | `pnpm mobile`  |
| [`docs`](docs)       | `@figentra/docs`    | the Mintlify documentation site, including every ADR (`src/adr`)                           | `pnpm docs`    |

## Rules

- An app is named `@figentra/<dir>`, keeps its code in `src/` and declares `tier:app` in its `turbo.jsonc`.
- An app imports packages only, never a service or another app
  ([ADR 0003](docs/src/adr/0003-tier-dependency-direction.mdx)).
- Every member carries `README.md`, `AGENTS.md` (with a `## PII` section), `CHANGELOG.md` and `LICENSE`
  (`pnpm validate`). Apps are not versioned by changesets; they deploy by commit SHA.
- Tests sit in `src/**/__tests__/`; an app's e2e tests live in the app.
- The mobile app uses code-based navigation; expo-router is rejected
  ([ADR 0061](docs/src/adr/0061-mobile-keeps-react-navigation-and-native-tabs.mdx)).
- Add an app with `pnpm new app:<console|mobile|desktop|docs> <name>`.

Standards: [apps](docs/src/standards/apps.mdx).
