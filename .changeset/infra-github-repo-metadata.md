---
"@stackra/infra-github": minor
---

`providers.github` takes the repository metadata: `description` (one sentence, at most 350 characters), `topics`
(lower-case GitHub topics, each once, at most 20) and `homepage` (an absolute URL). `githubPlan` carries them and
`githubStack` sets them on the repository (`description`, `topics`, `homepageUrl`), so a `preview` of the github
stack shows a repository whose metadata drifted from its runway.
