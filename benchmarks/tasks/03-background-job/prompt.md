# Task 3: a background job

The app keeps to-do items (see the starting app). Add a job that archives finished items by itself.

The app is started with the environment variable `ARCHIVE_AFTER_SECONDS`, a whole number of seconds (default
`3600` when it is not set).

- A task has a new field `archived`, a boolean, `false` at creation. Every response that returns a task includes it.
- The app records when a task was marked done. A task is done for as long as its `done` is `true`; setting `done` back
  to `false` ends that and forgets the time.
- A background job, running inside the app and not started by any request, checks at least once every second. It
  sets `archived` to `true` on every task that has been done for `ARCHIVE_AFTER_SECONDS` seconds or more. A task that
  is not done is never archived.
- `GET /tasks` leaves archived tasks out. `GET /tasks?archived=true` returns only archived tasks. Both keep creation
  order. `GET /tasks/:id` still returns an archived task, with `archived: true`.
- `PATCH /tasks/:id` with `"done": false` on an archived task makes it not archived again.
- `GET /jobs/archive` returns `200` with `{ "lastRunAt": <ISO 8601 UTC time or null>, "archivedTotal": <number> }`:
  the time the job last finished a check (`null` before the first), and how many tasks it has archived since the app
  started.

Change only what the feature needs. The existing behaviour must keep working.
