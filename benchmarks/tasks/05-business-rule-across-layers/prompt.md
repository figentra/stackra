# Task 5: a business rule changed across layers

The app keeps to-do items (see the starting app). A task is now either done or not, set by a `done` boolean. Replace
that with a short workflow, and keep the old `done` behaviour working for existing callers.

**Status.** A task has a `status`: `open` (the default), `in_progress` or `done`. Every response that returns a task
includes `status`, and keeps `done`, which is `true` exactly when `status` is `done`.

**Setting it.** `POST /tasks` and `PATCH /tasks/:id` accept `status`, or the old `done` (`true` means `done`, `false`
means `open`).

- A value of `status` that is not one of the three is refused with `400` and the error code `invalid_status`.
- If a request sends both `status` and `done` and they disagree (`done` is `true` exactly when `status` is `done`),
  it is refused with `400` and the error code `conflicting_state`.

**Moving.** On `PATCH`, every move is allowed except `done` to `in_progress`, which is refused with `409` and the
error code `invalid_transition`. Sending the status a task already has changes nothing and is allowed.

**Limit.** At most 3 tasks may be `in_progress` at the same time. A request that would make a fourth is refused with
`409` and the error code `too_many_in_progress`, on `POST` as well as on `PATCH`. A task that is already
`in_progress` can be patched (for its title, say) without counting against the limit again.

**Listing.** `GET /tasks?status=<value>` returns only tasks with that status, in creation order. A value that is not
one of the three is `400` with `invalid_status`.

**Summary.** `GET /tasks/summary` returns `200` with `{ "open": n, "in_progress": n, "done": n, "total": n }`
counting every task.

When a request is refused, nothing in the task is changed, not even the fields that were valid.

Change only what the feature needs. The existing behaviour must keep working.
