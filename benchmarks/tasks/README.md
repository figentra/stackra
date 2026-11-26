# `tasks/`

All tasks start from the same small HTTP app, described in [`starting-app.md`](starting-app.md) and written once per
framework by the baseline scripts, so there is no per-task starting state. One folder per task, named `NN-slug`,
holding:

- `prompt.md`: the plain-language task, the same text for every framework.
- `__tests__/`: the acceptance tests, which call the finished app over HTTP, so one set fits every framework.

Task set v0 (five tasks): add a field end to end; an authenticated endpoint with validation; a background job; a
list-and-edit page; a business rule changed across layers. A task that needs settings (tokens, a delay) names them in
its prompt; the runner starts the app with them.
