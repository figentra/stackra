---
"@stackra/infra-github": minor
"@stackra/runway": minor
---

`providers.github` takes the repository metadata: `description` (one sentence, at most 350 characters), `topics`
(lower-case GitHub topics, each once, at most 20) and `homepage` (an absolute URL). `githubPlan` carries them and
`githubStack` sets them on the repository (`description`, `topics`, `homepageUrl`), so a `preview` of the github
stack shows a repository whose metadata drifted from its runway. `@stackra/runway`'s closed `providers.github`
schema takes the same three keys, so `parseRunway` accepts them.
