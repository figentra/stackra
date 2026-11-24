# The starting app

Every task begins from the same small HTTP app, written once per framework on top of its official starter. Because
the tests only call it over HTTP, one acceptance set fits every framework.

- Resource: `tasks` (a to-do item). Fields at the start: `id` (string, assigned by the server), `title` (string, 1 to
  120 characters after trimming spaces at both ends, required; the stored title is the trimmed one) and `done`
  (boolean, default `false`). A bad title is `400` with `invalid_title`, a body that is not JSON is `400` with
  `invalid_json`, and an unknown id or path is `404` with `not_found`.
- Endpoints, JSON in and out, errors as `{ "error": { "code": "<snake_case>", "message": "<text>" } }`:
  - `POST /tasks` creates and returns `201` with the task.
  - `GET /tasks` returns `200` with `{ "items": [task, …] }` in creation order.
  - `GET /tasks/:id` returns `200` with the task, or `404`.
  - `PATCH /tasks/:id` changes the fields sent and returns `200` with the task, or `404`.
- Storage is in memory; a restart empties it. The server listens on the port in the `PORT` environment variable.

How a test run works: the runner starts a fresh app (no tasks in it) for every run, exports its address as `BASE_URL`, and runs
`node --test` on the task's `__tests__/` folder (its acceptance tests). The result is the pass and fail counts of that run.
