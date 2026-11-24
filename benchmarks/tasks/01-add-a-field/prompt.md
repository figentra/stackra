# Task 1: add a field end to end

The app keeps to-do items (see the starting app). Add an optional due date to each item.

- A task has a new field `dueDate`: a calendar date written `YYYY-MM-DD`, or `null` when there is none.
- `POST /tasks` and `PATCH /tasks/:id` accept `dueDate`. An item created without it has `dueDate: null`.
- Every response that returns a task includes `dueDate`.
- A value that is not a real calendar date (for example `2026-13-40` or `soon`) is refused with status `400` and the
  error code `invalid_due_date`.
- `PATCH` with `"dueDate": null` clears the date.
- `GET /tasks` accepts `?dueBefore=YYYY-MM-DD` and returns only items whose date is strictly before it; items with no
  date are left out of that filtered list.

Change only what the feature needs. The existing behaviour must keep working.
